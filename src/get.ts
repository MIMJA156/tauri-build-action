import { getOctokit, context } from "@actions/github";
import { GithubRelease } from "./data";

export async function get_release(tag_name: string): Promise<GithubRelease | null> {
    const github = getOctokit(process.env.GITHUB_TOKEN!);

    let release: GithubRelease | null = null;

    const params = { per_page: 100, owner: context.repo.owner, repo: context.repo.repo };
    const iterator = github.paginate.iterator(github.rest.repos.listReleases.endpoint.merge(params));

    for await (const response of iterator) {
        const possible_release = response.data.find((release) => (release as GithubRelease).tag_name === tag_name) as GithubRelease;

        if (possible_release) {
            release = possible_release;
        }
    }

    return release;
}
