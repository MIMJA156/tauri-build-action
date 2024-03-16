export class TauriProject {
    package: {
        version: string;
        productName: string;
    };

    updater: { active: boolean };

    constructor(config: any) {
        this.package = {
            version: config.package.version,
            productName: config.package.productName,
        };

        if (config.tauri.updater) {
            this.updater = {
                active: config.tauri.updater.active ?? false,
            };
        } else {
            this.updater = {
                active: false,
            };
        }
    }
}

export class LocalProject {
    releaseTag: string;
    releaseName: string;
    releaseBody: string;

    constructor(releaseTag: string, releaseName: string, releaseBody: string, project: TauriProject) {
        this.releaseTag = releaseTag.replace("$VERSION", project.package.version);
        this.releaseName = releaseName.replace("$VERSION", project.package.version);
        this.releaseBody = releaseBody.replace("$VERSION", project.package.version);
    }
}

export interface GithubRelease {
    id: number;
    tag_name: string;
}

export interface Asset {
    path: string;
    architecture: string;
}
