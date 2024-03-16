import { getOctokit, context } from "@actions/github";
import { Asset, LocalProject, TauriProject } from "./data";
import fs from "fs";

export async function uploadAssets(id: number, assets: Asset[]) {
    const github = getOctokit(process.env.GITHUB_TOKEN!);

    const alreadyUploaded = (
        await github.rest.repos.listReleaseAssets({
            owner: context.repo.owner,
            repo: context.repo.repo,
            release_id: id,
            per_page: 50,
        })
    ).data;

    for (const asset of assets) {
        const fileStats = fs.statSync(asset.path);
        if (fileStats.isDirectory()) continue;

        const headers = {
            "content-type": "application/zip",
            "content-length": fileStats.size,
        };

        const betterPath = asset.path.replace("\\", "/");
        const splitPath = betterPath.split("/");
        const assetName = splitPath[splitPath.length - 1];

        const hasDuplicateName = alreadyUploaded.find((a) => a.name === assetName.trim().replace(/ /g, "."));
        if (hasDuplicateName) {
            await github.rest.repos.deleteReleaseAsset({
                owner: context.repo.owner,
                repo: context.repo.repo,
                asset_id: hasDuplicateName.id,
            });
        }

        await github.rest.repos.uploadReleaseAsset({
            headers,
            name: assetName,
            data: fs.readFileSync(asset.path) as any,
            owner: context.repo.owner,
            repo: context.repo.repo,
            release_id: id,
        });
    }
}

export async function generateVersionJSON(id: number, projectPath: string, tauri: TauriProject, local: LocalProject, assets: Asset[]): Promise<string> {
    const updaterJSONName = "updater.json";
    const updaterJSONFilePath = projectPath + "/" + updaterJSONName;
    const github = getOctokit(process.env.GITHUB_TOKEN!);

    let updaterManifest: any = {
        version: tauri.package.version,
        notes: local.releaseBody,
        pub_date: new Date().toISOString(),
        platforms: {},
    };

    const alreadyUploaded = (
        await github.rest.repos.listReleaseAssets({
            owner: context.repo.owner,
            repo: context.repo.repo,
            release_id: id,
            per_page: 50,
        })
    ).data;

    const preExistingUpdaterJSONAsset = alreadyUploaded.find((e) => e.name === updaterJSONName);

    if (preExistingUpdaterJSONAsset) {
        const preExistingUpdaterJSONAssetData = (
            await github.request("GET /repos/{owner}/{repo}/releases/assets/{asset_id}", {
                owner: context.repo.owner,
                repo: context.repo.repo,
                asset_id: preExistingUpdaterJSONAsset.id,
                headers: {
                    accept: "application/octet-stream",
                },
            })
        ).data as unknown as ArrayBuffer;

        updaterManifest.platforms = JSON.parse(Buffer.from(preExistingUpdaterJSONAssetData).toString()).platforms;
    }

    const signatureFile = assets.find((a) => a.path.endsWith(".sig"));
    const buildFile = assets.find((a) => a.path.endsWith(".tar.gz") || a.path.endsWith(".zip"));

    if (buildFile && signatureFile) {
        const betterPath = buildFile.path.replace("\\", "/");
        const splitPath = betterPath.split("/");
        const assetName = splitPath[splitPath.length - 1];
        const path = `https://github.com/${context.repo.owner}/${context.repo.repo}/release/download/${local.releaseTag}/${assetName}`;

        updaterManifest.platforms[buildFile.architecture] = {
            signature: fs.readFileSync(signatureFile.path).toString(),
            url: path,
        };
    }

    fs.writeFileSync(updaterJSONFilePath, JSON.stringify(updaterManifest, null, 2));
    return updaterJSONFilePath;
}
