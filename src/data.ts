export class TauriProject {
    package: {
        version: string;
        productName: "";
    };

    constructor(config: any) {
        this.package = { version: "", productName: "" };
        this.package.version = config.package.version;
        this.package.productName = config.package.productName;
    }
}

export class LocalProject {
    release_tag: string;
    release_name: string;
    release_body: string;

    constructor(release_tag: string, release_name: string, release_body: string, project: TauriProject) {
        this.release_tag = release_tag.replace("$VERSION", project.package.version);
        this.release_name = release_name.replace("$VERSION", project.package.version);
        this.release_body = release_body.replace("$VERSION", project.package.version);
    }
}

export interface GithubRelease {
    id: number;
    tag_name: string;
}

export interface Asset {
    path: string;
    arch: string;
}
