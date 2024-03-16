import { getOctokit, context } from "@actions/github";
import { Asset } from "./data";
import fs from "fs";
import path from "path";

export async function upload_assets(id: number, assets: Asset[]) {
    const github = getOctokit(process.env.GITHUB_TOKEN!);

    const alreadyUploaded = (
        await github.rest.repos.listReleaseAssets({
            owner: context.repo.owner,
            repo: context.repo.repo,
            release_id: id,
            per_page: 25,
        })
    ).data;

    console.log(alreadyUploaded);
    console.log(assets);

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
