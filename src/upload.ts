import { getOctokit, context } from '@actions/github';
import { Artifact } from './data';
import fs from 'fs';
import path from 'path';

export async function upload_assets(id: number, assets: Artifact[]) {
    const github = getOctokit(process.env.GITHUB_TOKEN!);

    const already_uploaded = (
        await github.rest.repos.listReleaseAssets({
            owner: context.repo.owner,
            repo: context.repo.repo,
            release_id: id,
            per_page: 25,
        })
    ).data;

    console.log(assets);

    for (const asset of assets) {
        const headers = {
            'content-type': 'application/zip',
            'content-length': fs.statSync(asset.path).size,
        };

        const betterPath = asset.path.replace("\\", "/");
        const splitPath = betterPath.split("/");
        const assetName = splitPath[splitPath.length - 1];

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