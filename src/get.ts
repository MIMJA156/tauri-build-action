import { getOctokit, context } from "@actions/github";
import { GithubRelease } from "./data";

export async function getRelease(tagName: string): Promise<GithubRelease | null> {
    const github = getOctokit(process.env.GITHUB_TOKEN!);

    let release: GithubRelease | null = null;

    const params = { per_page: 50, owner: context.repo.owner, repo: context.repo.repo };
    const iterator = github.paginate.iterator(github.rest.repos.listReleases.endpoint.merge(params));

    for await (const response of iterator) {
        const possibleRelease = response.data.find((release) => (release as GithubRelease).tag_name === tagName) as GithubRelease;

        if (possibleRelease) {
            release = possibleRelease;
        }
    }

    return release;
}
