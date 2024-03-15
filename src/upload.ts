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
            per_page: 50,
        })
    ).data;

    for (const asset of assets) {
        const headers = {
            'content-type': 'application/zip',
            'content-length': fs.statSync(asset.path).size,
        };
    }
}
