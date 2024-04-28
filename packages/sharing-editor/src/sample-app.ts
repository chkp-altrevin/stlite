import { AppData, File } from "@stlite/sharing-common";
import { URL_SEARCH_KEY_SAMPLE_APP_ID } from "./url";
import sampleAppManifests from "./sample-app-manifests.json"; // This file is generated by bin/gen-sample-app-manifests-json.ts at build time.

const sampleAppBasePath = "/samples";

const TEXT_EXTS = [
  ".py",
  ".txt",
  ".csv",
  ".md",
  ".json",
  ".yml",
  ".yaml",
  ".toml",
];
async function loadFiles(
  fileNames: string[],
  sampleAppDirName: string
): Promise<AppData["files"]> {
  const fileNameAndUrls = fileNames.map((fileName) => [
    fileName,
    `${sampleAppBasePath}/${sampleAppDirName}/${fileName}`,
  ]);
  const fileNameAndContents = await Promise.all(
    fileNameAndUrls.map(
      async ([fileName, url]): Promise<[string, File["content"]]> => {
        const res = await fetch(url);
        if (res.status !== 200) {
          throw new Error(`Failed to fetch "${url}" (${res.status})`);
        }

        if (TEXT_EXTS.some((text_ext) => url.endsWith(text_ext))) {
          return res.text().then((text) => [
            fileName,
            {
              $case: "text",
              text,
            },
          ]);
        } else {
          return res.arrayBuffer().then((ab) => [
            fileName,
            {
              $case: "data",
              data: new Uint8Array(ab),
            },
          ]);
        }
      }
    )
  );

  const files: AppData["files"] = {};
  fileNameAndContents.forEach(([name, fileContent]) => {
    files[name] = {
      content: fileContent,
    };
  });

  return files;
}

export function getDefaultSampleAppId(): string {
  return sampleAppManifests[0].id;
}

export async function loadSampleAppData(sampleAppId: string) {
  const sampleAppManifest = sampleAppManifests.find(
    (manifest) => manifest.id === sampleAppId
  );
  if (sampleAppManifest == null) {
    throw new Error(`No sample app found for ${sampleAppId}`);
  }

  const files = await loadFiles(
    sampleAppManifest["files"],
    sampleAppManifest.basePath
  );

  const appData: AppData = {
    entrypoint: sampleAppManifest.entrypoint,
    requirements: sampleAppManifest.requirements,
    files,
  };

  return appData;
}

export function parseSampleAppIdInSearchParams(searchParams: URLSearchParams): {
  sampleAppId: string | null;
  isInvalidSampleAppId: boolean;
} {
  const sampleAppIdInUrl = searchParams.get(URL_SEARCH_KEY_SAMPLE_APP_ID);

  if (sampleAppIdInUrl == null) {
    return { sampleAppId: null, isInvalidSampleAppId: false };
  }
  if (sampleAppManifests.find((m) => m.id === sampleAppIdInUrl)) {
    return { sampleAppId: sampleAppIdInUrl, isInvalidSampleAppId: false };
  }
  return { sampleAppId: null, isInvalidSampleAppId: true };
}
