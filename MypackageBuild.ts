#!/usr/bin/env node

// This is a simple script used to build a mod package. The script will copy necessary files to the build directory
// and compress the build directory into a zip file that can be easily shared.

const fs = require("fs-extra");
const glob = require("glob");
const zip = require('bestzip');
const path = require("path");

const pathToMods = "C:\\games\\EFT_3.5.8\\user\\mods"


const { author, name:packageName, version } = require("./package.json");

const modName = `${author.replace(/[^a-z0-9]/gi, "")}-${packageName.replace(/[^a-z0-9]/gi, "")}-${version}`;
console.log(`Generated package name: ${modName}`);

fs.rmSync(`${__dirname}/${modName}`, { force: true, recursive: true });
fs.rmSync(`${__dirname}/dist`, { force: true, recursive: true });
console.log("Previous build files deleted.");

const ignoreList = [
    "node_modules/",
    "src/**/*.js",
    "types/",
    ".git/",
    ".gitea/",
    "clientsMod/",
    ".eslintignore",
    ".eslintrc.json",
    ".gitignore",
    ".DS_Store",
    "packageBuild.ts",
    "mod.code-workspace",
    "package-lock.json",
    "tsconfig.json",
    ".idea",
    "README.md",
    "test.json",
    "test2.json",
    "test3.json",
    "test4.json",
    "test5.json",
    "test6.json",
    "test7.json",
    "allItemsName.json",
    "MypackageBuild.ts",
    "clientsMod",
    "dist",
    modName
];
const exclude = glob.sync(`{${ignoreList.join(",")}}`, { realpath: true, dot: true });

fs.copySync(__dirname, path.normalize(`${__dirname}/../~${modName}`), {filter:(filePath) =>
{
    return !exclude.includes(filePath);
}});
fs.moveSync(path.normalize(`${__dirname}/../~${modName}`), path.normalize(`${__dirname}/${modName}`), { overwrite: true });
fs.copySync(path.normalize(`${__dirname}/${modName}`), path.normalize(`${pathToMods}/MarsyApp-TradeDeficit`));
console.log("Build files copied.");

fs.copySync(path.normalize(`${__dirname}/${modName}`), path.normalize(`${__dirname}/dist/user/mods/MarsyApp-TradeDeficit`));
fs.copySync(path.normalize(`${__dirname}/clientsMod/bin/Release/net472/MarsyApp-TradeDeficit.dll`), path.normalize(`${__dirname}/dist/BepInEx/plugins/MarsyApp-TradeDeficit.dll`));
console.log("dist files copied.");

const dirsArray = fs.readdirSync(`${__dirname}/dist`);
console.log(dirsArray);
zip({
    source: dirsArray,
    destination: `${modName}.zip`,
    cwd: `${__dirname}/dist`,
}).catch(function(err)
{
    console.error("A bestzip error has occurred: ", err.stack);
}).then(function()
{
    console.log(`Compressed mod package to: /dist/${modName}.zip`);

    fs.rmSync(`${__dirname}/${modName}`, { force: true, recursive: true });
    console.log("Build successful! your zip file has been created and is ready to be uploaded to hub.sp-tarkov.com/files/");
});
