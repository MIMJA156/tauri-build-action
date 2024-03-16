import { getOctokit, context } from "@actions/github";
import { GithubRelease, LocalProject } from "./data";

export async function create_release(project: LocalProject): Promise<GithubRelease | null> {
    const github = getOctokit(process.env.GITHUB_TOKEN!);

    const createdRelease = await github.rest.repos.createRelease({
        owner: context.repo.owner,
        repo: context.repo.repo,
        tag_name: project.release_tag,
        name: project.release_name,
        body: project.release_body,
        draft: true,
        prerelease: false,
        target_commitish: context.sha,
    });

    return createdRelease.data;
}
