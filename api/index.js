const { Octokit } = require("@octokit/rest");
var base64 = require("base-64");
const fetch = require("isomorphic-unfetch");
require("dotenv").config();
const { toHTML } = require("slack-markdown");
var h2m = require("h2m");

export default async (req, res) => {
  const octokit = new Octokit({
    auth: process.env.GH_TOKEN,
  });

  const ogfile = await octokit.repos.getContent({
    owner: process.env.GH_USERNAME,
    repo: process.env.GH_USERNAME,
    path: "README.md",
  });

  const scrapbookDetails = await fetch(
    `https://scrapbook.hackclub.com/api/users/${process.env.SCRAPBOOK_USERNAME}/`
  ).then((r) => r.json());

  const scrapbookPosts = scrapbookDetails.posts;

  console.log(h2m(toHTML(scrapbookPosts[0].text)).slice(0, 100));

  const tableToAdd = `
  <!--- START_SCRAPBOOK_WIDGET --->
  | <img src ="${scrapbookPosts[0].attachments[0].url}">  |  <img src ="${
    scrapbookPosts[1].attachments[0].url
  }"> | <img src ="${scrapbookPosts[2].attachments[0].url}"> |
|---|---|---|
| ${h2m(toHTML(scrapbookPosts[0].text)).slice(0, 100)}${
    scrapbookPosts[0].text.length > 100 ? "..." : ""
  } | ${h2m(toHTML(scrapbookPosts[1].text)).slice(0, 100)}${
    scrapbookPosts[1].text.length > 100 ? "..." : ""
  }  | ${h2m(toHTML(scrapbookPosts[2].text)).slice(0, 100)}${
    scrapbookPosts[2].text.length > 100 ? "..." : ""
  }   |
  <!--- END_SCRAPBOOK_WIDGET --->
  `;

  const result = await octokit.repos.createOrUpdateFileContents({
    owner: process.env.GH_USERNAME,
    repo: process.env.GH_USERNAME,
    path: "README.md",
    message: "New Scrapbook Post!",
    content: base64.encode(
      base64
        .decode(ogfile.data.content)
        .replace("<!--- SCRAPBOOK_WIDGET --->", tableToAdd)
        .replace(
          /(<!--- START_SCRAPBOOK_WIDGET --->)[^{}]*(<!--- END_SCRAPBOOK_WIDGET --->)/,
          tableToAdd
        )
    ),
    sha: ogfile.data.sha,
    committer: { name: "Scrapbook", email: "scrappy@sampoder.com" },
    author: { name: "Scrapbook", email: "scrappy@sampoder.com" },
  });

  res.send('Done!')
}