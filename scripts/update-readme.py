import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path


USERNAME = os.environ["GITHUB_USERNAME"]
PROFILE_REPO = f"{USERNAME}/{USERNAME}"

START = "<!-- START_GIT_LOG -->"
END = "<!-- END_GIT_LOG -->"

README = Path("README.md")


def github_api(endpoint):
    result = subprocess.run(
        ["gh", "api", endpoint],
        check=True,
        capture_output=True,
        text=True,
    )

    return json.loads(result.stdout)


def main():
    # Look back 30 days. This gives us enough history to survive
    # occasional missed workflow runs.
    query = (
        f"author:{USERNAME} "
        "author-date:>=2026-01-01 "
        "-repo:aryanjha256/aryanjha256"
    )

    data = github_api(
        "search/commits"
        f"?q={query.replace(' ', '+')}"
        "&sort=author-date"
        "&order=desc"
        "&per_page=20"
    )

    commits = data.get("items", [])

    lines = []

    for commit in commits[:10]:
        repository = commit["repository"]["name"]
        message = commit["commit"]["message"].splitlines()[0]

        date = commit["commit"]["author"]["date"]
        date = datetime.fromisoformat(date.replace("Z", "+00:00"))

        date_string = date.strftime("%Y-%m-%d")

        # Keep the README reasonably compact.
        if len(message) > 70:
            message = message[:67] + "..."

        lines.append(
            f"{date_string}  {repository:<16} {message}"
        )

    if not lines:
        lines = ["no recent commits. suspicious."]

    block = "\n".join(
        [
            START,
            "",
            "```text",
            *lines,
            "```",
            "",
            END,
        ]
    )

    readme = README.read_text()

    start_index = readme.find(START)
    end_index = readme.find(END)

    if start_index == -1 or end_index == -1:
        raise RuntimeError(
            "README is missing START_GIT_LOG / END_GIT_LOG markers"
        )

    end_index += len(END)

    updated = (
        readme[:start_index]
        + block
        + readme[end_index:]
    )

    README.write_text(updated)


if __name__ == "__main__":
    main()
