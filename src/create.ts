import { getOctokit, context } from "@actions/github";
import { GithubRelease, LocalProject } from "./data";

export async function createRelease(project: LocalProject): Promise<GithubRelease | null> {
    const github = getOctokit(process.env.GITHUB_TOKEN!);

    const createdRelease = await github.rest.repos.createRelease({
        owner: context.repo.owner,
        repo: context.repo.repo,
        tag_name: project.releaseTag,
        name: project.releaseName,
        body: project.releaseBody,
        draft: true,
        prerelease: false,
        target_commitish: context.sha,
    });

    return createdRelease.data;
}
