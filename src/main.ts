import * as core from "@actions/core";
import * as github from "@actions/github";
import * as yaml from "js-yaml";
import * as fs from "fs";

async function run() {
  try {
    //core.debug(`${JSON.stringify(github.context)}`) 
    const token = core.getInput("github-token", { required: true });
    const configPath = core.getInput("configuration-path", { required: true });
    const issueNumber = getIssueNumber();

    if (!issueNumber) {
        console.log("Could not get issue number from context, exiting.");
        return;
    }

    const client = new github.GitHub(token);
    const configurationContent: JSON = JSON.parse(JSON.stringify(yaml.load(fs.readFileSync(configPath, 'utf8'), {json: true})));

    core.debug("remove assignees.")
    const issue: JSON = JSON.parse(JSON.stringify(github.context.payload.issue));
    //core.debug(`issue: ${JSON.stringify(issue)}`)
    for (const element of issue['assignees']) {
      const loginName = JSON.parse(JSON.stringify(element))['login']
      //core.debug(`loginname: ${loginName}`)
      removeAssignees(client, issueNumber, loginName);
    };

    for (const key of Object.keys(configurationContent)){
      if (github.context.payload.label.name == key) {
        for (const element of JSON.parse(JSON.stringify(configurationContent[key]))) {
          if (element == ["issue-author"]) {
            element = [issue['user']['login']]
          }
          addAssignees(client, issueNumber, element);
        };
      }
    };
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

function getIssueNumber(): number | undefined {
  const issue = github.context.payload.issue;
  if (!issue) {
      return undefined;
  }
  
  return issue.number
}

async function addAssignees(
  client: github.GitHub,
  issueNumber: number,
  assignees: string[]
) {
  await client.issues.addAssignees({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber,
    assignees: assignees
  })
}

async function removeAssignees(
  client: github.GitHub,
  issueNumber: number,
  assignees: string[]
) {
  await client.issues.removeAssignees({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber,
    assignees: assignees
  })
}

run();