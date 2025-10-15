# copai

## Installation

### NixOS

```nix
{
  copai = {
    url = "github:inet4/copai";
    inputs.nixpkgs.follows = "nixpkgs"; # optional to prevent duplicates
    inputs.firefox-extensions.follows = "firefox-extensions"; # optional to prevent duplicates
  };
}
```

The signed firefox extension can be accessed using: 
```nix
  copai = copai.packages.${system}.default;
```

And then added as an extension.
For example: 
```nix
programs.firefox.profiles.default.extensions.packages = [ copai ];
```

### Local Installation

This is a firefox extension. In order to use it, first download and unzip the add-on.
> Note: In the future, it may also be available on addons.mozilla.org.

Open any firefox-based browser and visit `about:debugging#/runtime/this-firefox`. Then scroll down until you see `Temporary Extensions`. Press the `Load Temporary Add-on...` button and select any file inside the unzipped directory.

Now you are good to go!

## Usage

### Setting the API Key
Use `p` to set your OpenAI API key.
> sk-proj-...

### Changing the Prompt
Use `m` to change the default prompt

### Copying the question
In order to answer a specific questions, it must first be copied to the system-clipboard.
Some websites disallow copy-operations, thus the [re-enable-right-click extension](https://addons.mozilla.org/en-US/firefox/addon/re-enable-right-click/) may be required.

### Fetch Solutions
After copying a question to your clipboard, you can press `a` to fetch the answer to the question. This only works for questions that are text-only.

###  Display Answers
In order to actually view the solution, you must keep the `l` key pressed. The list of solutions for the current question will appear on the bottom right.

## Troubleshooting
There may be problmes if the API key is invalid or doesn't have enough quota. Make sure that you use a key that is able to query models successfully.
c

This can be tested using:
```sh
curl "https://api.openai.com/v1/responses" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d '{
        "model": "gpt-5",
        "input": "Write a one-sentence bedtime story about a unicorn."
    }'
```
