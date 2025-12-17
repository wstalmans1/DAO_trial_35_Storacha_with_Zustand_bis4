# Storacha Network Documentation

## Welcome

Hey there, Storage Superstar!

Welcome to the hottest storage solution in the web3 universe! You've landed at Storacha Network, the dazzling revitalization of Web3.Storage. We're here to keep your data safe, sound, and supercharged with the power of decentralization.

Under the hood Storacha uses UCANs for trustless, local-first authorization, and is backed by the provable storage of Filecoin. Our goal is to enhance Filecoin with a scalable hot storage solution while also ensuring the data is retrievable via IPFS.

When it comes down to building your next application, service, or website, Storacha keeps it simple. You get all the benefits of decentralized storage technologies with the frictionless experience you expect in a modern dev workflow. To use Storacha, all you need is a key-pair and your data.

### Where to start?

Whether you're building with JavaScript, TypeScript or Go, we've got you covered:

- **JavaScript/TypeScript**: Check out our guide to using the JS client.
- **Go**: Explore our guide for Go client to build robust backend integrations.
- **Command Line**: Dive into our guide for using the CLI.

Feeling terminal? Jump in to our interactive workshop to learn you the w3up protocol for much win!

Get started by installing it from npm:

```bash
$ npm install -g learnyouw3up
$ learnyouw3up
```

For more details, visit our [learnyouw3up GitHub repository](https://github.com/storacha/learnyouw3up).

### Join the Storacha Party!

Stay connected and be part of the fun with the Storacha community:

- **Discord**: Jump into our Discord server for live support and endless chats.
- **Github**: Check out our GitHub repos and contribute to our awesome projects.
- **X**: Follow us on X for the latest updates, memes, and more.
- **YouTube**: Watch tutorials and demos our channel.

### Need a Hand?

Got questions or need a bit of help? Don't hesitate to contact our support team. We're here to make your Storacha experience as smooth and spicy as possible.

Thanks for joining us on this adventure. Let's make storage history together with Storacha Network - where your data stays hot and happening!

💾 CLI | ✨ JS Client | 🐹 Go Client | Quickstart

---

## Quickstart

Ready to get started using Storacha? Get up and running in minutes by following this quickstart guide. In this guide, we'll walk through the following steps:

1. Install the CLI.
2. Create a Space to upload your files and register it with Storacha.
3. Upload a file.
4. Get your uploaded file using your browser or curl.

This guide uses our CLI tool since it's the fastest way to get started using Storacha. In the "How-To" section of the docs, we also include instructions on using the Javascript client or web interface to create an account, store data, and more.

### You Will Need

Node.js version 18 or higher and npm version 7 or higher to complete this guide. Check your local versions like this:

```bash
node --version && npm --version
```

### Install the CLI

Install the CLI from npm using your command line:

```bash
npm install -g @storacha/cli
```

### Create an Account

You need to create a Storacha account associated with an email address and set it up so you can start uploading to a Space. The Space is created locally and associated with a private key. Then the Space is registered with Storacha and associated with your email address. But don't worry about keeping track of the Space's private key! Storacha's email authorization system allows this private key to be treated as a throwaway key.

1. Run `storacha login alice@example.com` in the command line using your email address. This will send an email to your inbox with a link for validation.
2. Once you click on the validation link, you'll be taken to a webpage where you can select a plan (like our Starter tier).
3. Create a new Space for storing your data and register it:

```bash
storacha space create Documents # pick a good name! you can't change it later
```

### Upload

You can now upload a file or directory using the command line:

```bash
storacha up lets-go.txt 
  1 file 0.9KB
🐔 Stored 1 file
🐔 https://storacha.link/ipfs/bafybeiaadqdddryecmilzvewulbo4gtuwxvwvn7gk2nsbfk6q7yjsxzeue
```

The CLI content-addresses your files, packs them into 1 or more CAR files, and uploads them to Storacha for indexing and inclusion in Filecoin storage deals. It will show an HTTP gateway URL that includes the content CID (content identifier) of your upload e.g:

`https://storacha.link/ipfs/bafybeiaadqdddryecmilzvewulbo4gtuwxvwvn7gk2nsbfk6q7yjsxzeue`

By default, the CLI will wrap files in a folder, so that their filename is preserved. They can then be accessed directly by adding their name in the URL path:

`https://storacha.link/ipfs/bafybeiaadqdddryecmilzvewulbo4gtuwxvwvn7gk2nsbfk6q7yjsxzeue/lets-go.txt`

### Get Your File

Your upload is now available over the public IPFS network using the content CID of your upload. The easiest way to fetch it is using the link that `storacha up` provided to the storacha.link gateway. The storacha.link gateway is optimized for content uploaded to Storacha.

```bash
curl -L 'https://storacha.link/ipfs/bafybeiaadqdddryecmilzvewulbo4gtuwxvwvn7gk2nsbfk6q7yjsxzeue/lets-go.txt'
```

You can also fetch your content p2p style over bitswap with an IPFS implementation like helia or kubo.

```bash
ipfs cat bafybeiaadqdddryecmilzvewulbo4gtuwxvwvn7gk2nsbfk6q7yjsxzeue/lets-go.txt
```

### Next Steps

Congratulations! You've just covered the basics of Storacha. To learn more, take a look at these useful resources:

- For a deep dive into storing files, including using the Javascript client to do so, visit the How to Upload guide.
- Read and learn about the power of UCANs and IPFS and the various options to integrate Storacha with your application.

---

## JS Client

You can easily integrate Storacha into your JavaScript apps using `@storacha/client`, our JavaScript client for the Storacha Network.

In this guide, we'll walk through the following steps:

1. Installing the client library
2. Creating and provisioning your first space
3. Uploading a file or directory
4. Viewing your file with IPFS

### Install

You'll need Node version 22 or higher, with NPM version 7 or higher to complete this guide. You can check your local versions like this:

```bash
node --version && npm --version
```

Add the library to your project's dependencies:

```bash
npm install @storacha/client
```

To use the client, import and call the create function:

```javascript
import { create } from "@storacha/client";

const client = await create();
```

See the README for more creation options.

### Create and Provision a Space

Everything uploaded to Storacha is associated with a "Space". A space is a unique identifier that acts as a namespace for your content. Spaces are identified by a DID (decentralized identifier) using keys created locally on your devices.

The first thing to do is login your Agent with your email address. Calling login will cause an email to be sent to the given address. Once a user clicks the confirmation link in the email, the login method will resolve. Make sure to check for errors, as login will fail if the email is not confirmed within the expiration timeout. Authorization needs to happen only once per agent.

```javascript
const account = await client.login("zaphod@beeblebrox.galaxy");
```

If your account doesn't have a payment plan yet, you'll be prompted to select one after verifying your email. A payment plan is required to provision a space. You can use the following code to wait until a payment plan is selected:

```javascript
// Wait for a payment plan with a 1-second polling interval and 15-minute timeout
await account.plan.wait();
```

Spaces can be created using the createSpace client method.

```javascript
const space = await client.createSpace("my-awesome-space", { account });
```

Alternatively, you can use the CLI command `storacha space create` for a streamlined approach.

#### Additional Notes

⚠️ **Important** If you do not provide the account parameter when creating a space, you risk losing access to your space in case of device loss or credential issues.

**Account Parameter**

Supplying an account in the options automatically provisions a delegated recovery account. This enables you to store data securely and delegate access to the recovery account, allowing access to your space from other devices as long as you have your account credentials.

**Name Parameter**

The name parameter is optional. If provided, it will be stored in your client's local state and can serve as a user-friendly identifier for interfaces.

**Current Space**

- If this is your Agent's first space, it will be automatically set as the "current space."
- For additional spaces, you can manually set a new space as the current one using:
  ```javascript
  await client.setCurrentSpace(space.did());
  ```

**Authorized Gateways**

When creating a space, you can specify which Gateways are authorized to serve the content you upload. By default, if no other flags are set the client will automatically grant access to the Storacha Gateway to serve the content you upload to your space.

However, you can authorize other Storacha compliant gateways to serve content instead.

### Upload Files

Now that you've created and provisioned a space, you're ready to upload files to Storacha!

Call `uploadFile` to upload a single file, or `uploadDirectory` to upload multiple files.

`uploadFile` expects a "Blob like" input, which can be a Blob or File when running in a browser. On Node.js, see the files-from-path library, which can load compatible objects from the local filesystem.

`uploadDirectory` requires File-like objects instead of Blobs, as the file's name property is used to build the directory hierarchy.

You can control the directory layout and create nested directory structures by using `/` delimited paths in your filenames:

```javascript
const files = [
  new File(["some-file-content"], "readme.md"),
  new File(["import foo"], "src/main.py"),
  new File([someBinaryData], "images/example.png"),
];

const directoryCid = await client.uploadDirectory(files);
```

In the example above, `directoryCid` resolves to an IPFS directory with the following layout:

```
.
├── images
│   └── example.png
├── readme.md
└── src
    └── main.py
```

### View Your File on an IPFS Gateway

The `uploadFile` and `uploadDirectory` methods described in the previous step both return a CID, or Content Identifier - a unique hash of the data.

To create a link to view your file on an IPFS gateway, create a URL of the form `https://${cid}.ipfs.${gatewayHost}`, where `${cid}` is the CID of the content you want to view, and `${gatewayHost}` is the domain of the gateway. To use our own gateway at storacha.link, your URL would be `https://${cid}.ipfs.storacha.link`.

Opening the gateway URL in a browser will take you to your uploaded file, or a directory listing of files, depending on what you uploaded.

Of course, gateways aren't the only option for fetching data from IPFS! If you're running a kubo node, you can use `ipfs get <your-cid>` to fetch your content from the peer-to-peer IPFS Bitswap network.

---

## API Reference

### How to

#### Create an Account

In this how-to guide, you'll learn how to to create an account.

Anyone can use console.storacha.network to create an account and manage their storage using a web browser. Developers can use the CLI or the JS/Go client libraries. We recommend that developers get familiar with the CLI since it's a powerful tool for many things you might want to do.

**Using the CLI**

The easiest way to create an account is using the CLI.

1. Install the CLI from npm using your command line: `npm install -g @storacha/cli`.
2. Run `storacha login alice@example.com` in the command line using your email address. This will send an email to your inbox with a link for validation.
3. Once you click on the validation link, you'll be taken to a webpage where you can enter your payment information and select a plan (like our Free tier).
4. Now you have created an account.

Further information can be found in our CLI guide.

**Using console.storacha.network**

1. Visit console.storacha.network.
2. If you don't have an account, the website will ask you for your email address. Enter your email address and submit the form.
3. Check your email for a message from Storacha including a link to confirm your intention to authenticate using the email you provided.

**Using the JS Client**

1. Install the client library from npm using your command line: `npm install @storacha/client`.
2. Call `client.login('alice@example.com')`, and wait for the promise to resolve. This will send an email to your inbox with a link for validation.
3. Once you click on the validation link, you'll be taken to a webpage where you can enter your payment information and select a plan (like our Free tier).
4. Now you have created an account.

Further information can be found in our JS client guide.

#### How to Create a Space

In this how-to guide, you'll learn how to create a Storacha Space to organize stored data. For an overview of the various ways Storacha can be integrated with your application, check out Architecture Options.

A Space acts as a namespace for your uploads. It is created locally, offline, and associated with a cryptographic key pair (identified by the did:key of the public key). You can register this Space with your Storacha account to take responsibility for the uploads in the space. Once you do this, you don't need to worry about keeping track of the Space's private key, because your Storacha account has been authorized to use the Space.

Please note that while you can create a space you cannot yet delete a space. Having an extra, empty space will not increase your billed data usage. We plan to offer the ability to delete spaces in the future.

**Using the CLI**

The easiest way to create and register a Space is by using the CLI.

1. Install the CLI from npm using your command line: `npm install -g @storacha/cli`
2. initiate space creation for a new Space:
   ```bash
   storacha space create
   ```
3. The CLI will ask "What would you like to call this space?". Give the space a name that will help you distinguish it from other spaces, then press the enter key. Can't come up with one? Try "my first space"
4. The CLI will say "🔑 You need to save the following secret recovery key somewhere safe!…"
5. Press the enter key to reveal the recovery phrase.
6. Save the recovery phrase somewhere safe if you want to be able to recover control of the space in case you lose access to the computer you used to create the space
7. Even if you don't need this level of recovery, you will need to store this phrase and be able to repeat it in the next step
8. Type the recovery phrase so the CLI knows you have backed it up, then press the enter key

**Using console.storacha.network**

Separately, you can visit console.storacha, sign up with your email and select a plan, and create a space using the UI. However, we recommend that developers get familiar with the CLI since it's a powerful tool for many things you might want to do.

The Space you create can be used to upload data using the CLI, the JS/Go client, or when you log into the web console.

**Using the JS Client**

1. Install the client library from npm using your command line: `npm install @storacha/client`.
2. Execute `client.createSpace('Documents')` and wait for the promise to resolve.
3. The space must be provisioned by an account before it can be used for uploads. See our guide for more details.

#### How to Upload Data Using Storacha

In this how-to guide, you'll learn how to store data programmatically for your development projects using the Storacha client library in JavaScript using your (developer-owned) Space. This includes various architecture options for the data pipeline for your users to upload to Storacha, which then makes your data available on the decentralized IPFS network with persistent long-term storage provided by Filecoin.

Later in this section, we also cover uploading data using the CLI or web console. If you just want to quickly store a few files using Storacha rather than include upload functionality in an app or service you're building, you may want to hop down there.

**Public Data 🌎**

All data uploaded to the Storacha Network is available to anyone who requests it using the correct CID. Do not store any private or sensitive information in an unencrypted form using Storacha.

**Permanent Data ♾️**

Removing files from the Storacha Network will remove them from the file listing for your account, but that doesn't prevent nodes on the decentralized storage network from retaining copies of the data indefinitely. Storacha itself generally retains and charges users for any uploaded data for a minimum of 30 days. Do not use Storacha for data that may need to be permanently deleted in the future.

**Using the CLI**

If you followed the Create Account and Create Space sections, you will already have the CLI set up with a Space. However, you might be using the CLI on a new machine, in which case you can follow these instructions:

1. Install the CLI from npm using your command line: `npm install -g @storacha/cli`.
2. Run `storacha login alice@example.com` in the command line using your email address. Click on the validation link sent to your email.
3. After successfully running login, your CLI Agent has been delegated access to all Spaces associated with your email address. You can see a list of these Spaces using `storacha space ls` and select the one you'd like to upload to using `storacha space use <space_did>`.
4. When the right Space is selected, you are ready to upload! You can do so by running `storacha up <path>`.

There are a few useful flags (check out the reference docs or `storacha up --help` to see a full list):

- `--no-wrap` - Don't wrap input files with a directory.
- `-H, --hidden` - Include paths that start with ".".
- `-c, --car` - File is a CAR file.

**Using the JS Client**

**Installing the Client**

In your JavaScript project, add the Storacha package to your dependencies:

```bash
npm install @storacha/client
```

**Creating a Client Instance**

The package provides a static `create` function that returns a Client object. How you initialize it depends on the environment the client is used in: persistent or ephemeral.

Examples of persistent environments:

- A browser application
- A terminal application
- An installed application (e.g. Electron)

Examples of ephemeral environments:

- AWS Lambda or server side workers
- Running inside Docker instances
- CI

**Claim Delegations via Email Validation**

*For persistent environment only*

A new client can claim access to their existing Spaces by validating their email address.

You can use Storacha's email authorization flow to give permissions to your client. This can be good if your environment will be persistent (otherwise it would be prohibitive to click an email validation link every time the client is re-instantiated).

When a Space is created, access permissions are delegated to your email address. We use a special kind of DID for this, a `did:mailto:`. These UCANs are stashed with the Storacha service. When you validate your email address with a new Agent DID, Storacha issues a UCAN attestation, that says your Agent DID is owned by your email address. It also returns the UCAN permissions you previously stashed. You can then use the returned UCANs, along with the attestation to prove you are authorized to perform actions.

```javascript
import { create } from '@storacha/client'
const client = await create()
```

By default, constructing a client like this will re-use state persisted by other clients because `create` constructs the client with a store that persists data between processes and client instances.

Once you have created a client, you can login with your email address. Calling login will cause an email to be sent to the given address.

```javascript
await client.login('zaphod@beeblebrox.galaxy')
```

Once a user clicks the confirmation link in the email, the login method will resolve. Make sure to check for errors, as login will fail if the email is not confirmed within the expiration timeout. Authorization needs to happen only once per agent. This also claims all delegations available with your email address, so from there, you can select the Space you'd like to use.

```javascript
await client.setCurrentSpace('did:key:...') // select the relevant Space DID that is associated with your account
```

**Bring Your Own Delegations**

*For any backend (including non-persistent and/or serverless)*

An option that works for any backend environment is for a developer to create and provision a Space, and then delegate access to a different Agent DID that will be used by the client. This is especially useful if you're using the client in a serverless environment (e.g., AWS Lambda).

In your terminal where the Storacha CLI is installed configured with the Space you want to use (e.g., where you created the Space):

```bash
# The following command returns what will be your Agent private key and DID
storacha key create

# ❗️ Store the private key (starting "Mg...") in environment variable KEY

# The following command creates a UCAN delegation from the CLI agent to the
# agent you generated above.
#
# Use `storacha space use` prior to this to set the Space you intend on
# delegating access to.
#
# If you want to limit permissions being passed to the Agent, you can specify
# permissions to give, e.g., `--can space/blob/add --can space/index/add --can
# filecoin/offer --can upload/add` limits to just being able to upload.
storacha delegation create <did_from_ucan-key_command_above> --base64

# ❗️ Store the output in environment variable PROOF
```

Then, when you initialize and configure the client, you can pass in this private key and UCAN delegation.

```javascript
import * as Client from '@storacha/client'
import { StoreMemory } from '@storacha/client/stores/memory'
import * as Proof from '@storacha/client/proof'
import { Signer } from '@storacha/client/principal/ed25519'

// Load client with specific private key
const principal = Signer.parse(process.env.KEY)
const store = new StoreMemory()
const client = await Client.create({ principal, store })
// Add proof that this agent has been delegated capabilities on the space
const proof = await Proof.parse(process.env.PROOF)
const space = await client.addSpace(proof)
await client.setCurrentSpace(space.did())
// READY to go!
```

**Uploading to Storacha**

Now that your client instance is setup to interact with your Space, you're ready to upload! Call `uploadFile` to upload a single file, or `uploadDirectory` to upload multiple files.

There are two main options to getting content into your Space:

1. Upload data to Storacha from the backend client itself (e.g., you're storing data that your users are uploading to your backend)
2. Upload data to Storacha directly from your user's environment (like your application's user's browser) by delegating a UCAN that has permission to upload to your Space

**Upload from Backend Client Directly**

You are already set up to upload using your client instance as data becomes available to your backend - you can call `uploadFile` or `uploadDirectory` with it.

```javascript
import { create } from '@storacha/client'
import { filesFromPaths } from 'files-from-path'

// e.g "./best-gifs"
const path = process.env.PATH_TO_FILES
const files = await filesFromPaths([path])

const client = await create()
const directoryCid = await client.uploadDirectory(files)
```

In the example above, `directoryCid` resolves to an IPFS directory.

**Delegate UCAN for your User to Upload Directly**

Your backend instance can also be used to delegate upload permissions directly to your user to upload. The code snippet below shows an example of how you might set up a client instance in your application frontend and how it might interact with your backend client. You can see how the frontend client Agent DID is used for the backend client to delegate permissions to; from there, it will be the frontend client that will call the upload method.

**Backend**

```javascript
import * as Client from '@storacha/client'
import { StoreMemory } from '@storacha/client/stores/memory'
import * as Proof from '@storacha/client/proof'
import { Signer } from '@storacha/client/principal/ed25519'
import * as DID from '@ipld/dag-ucan/did'
import type { ServiceAbility } from '@storacha/client'

async function backend(did) {
  // Load client with specific private key
  const principal = Signer.parse(process.env.KEY)
  const store = new StoreMemory()
  const client = await Client.create({ principal, store })

  // Add proof that this agent has been delegated capabilities on the space
  const proof = await Proof.parse(process.env.PROOF)
  const space = await client.addSpace(proof)
  await client.setCurrentSpace(space.did())

  // Create a delegation for a specific DID
  const audience = DID.parse(did)
  const abilities: ServiceAbility[] = ['space/blob/add', 'space/index/add', 'filecoin/offer', 'upload/add']
  const expiration = Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours from now
  const delegation = await client.createDelegation(audience, abilities, { expiration })

  // Serialize the delegation and send it to the client
  const archive = await delegation.archive()
  return archive.ok
}
```

**Frontend**

```javascript
import * as Delegation from '@storacha/client/delegation'
import * as Client from '@storacha/client'

async function frontend() {
  // Create a new client
  const client = await Client.create()

  // Fetch the delegation from the backend
  const apiUrl = `/api/storacha-delegation/${client.agent.did()}`
  const response = await fetch(apiUrl)
  const data = await response.arrayBuffer()

  // Deserialize the delegation
  const delegation = await Delegation.extract(new Uint8Array(data))
  if (!delegation.ok) {
    throw new Error('Failed to extract delegation', { cause: delegation.error })
  }

  // Add proof that this agent has been delegated capabilities on the space
  const space = await client.addSpace(delegation.ok)
  client.setCurrentSpace(space.did())

  // READY to go!
}
```

**Preparing Files and Uploading**

You are now ready to upload using the client! In general, the easiest way to upload data is using the `uploadFile` or `uploadDirectory` method.

`uploadFile` expects a "Blob like" input, which can be a Blob or File when running in a browser. On Node.js, see the files-from-path library, which can load compatible objects from the local filesystem. By default, files uploaded to Storacha will be wrapped in an IPFS directory listing. This preserves the original filename and makes links more human-friendly than CID strings, which look like random gibberish.

`uploadDirectory` requires File-like objects instead of Blobs, as the file's name property is used to build the directory hierarchy.

When uploading multiple files, give each file a unique name. All the files in a `uploadDirectory` request will be bundled into one content archive, and linking to the files inside is much easier if each file has a unique, human-readable name.

You can control the directory layout and create nested directory structures by using `/` delimited paths in your filenames:

```javascript
const files = [
  new File(['some-file-content'], 'readme.md'),
  new File(['import foo'], 'src/main.py'),
  new File([someBinaryData], 'images/example.png'),
]

const directoryCid = await client.uploadDirectory(files)
```

In the example above, `directoryCid` resolves to an IPFS directory with the following layout:

```
.
├──images
|  └──example.png
├──readme.md
└──src
   └──main.py
```

There are a few different ways of creating File objects available, depending on your platform.

In the browser, you can use a file input element to allow the user to select files for upload:

```javascript
function getFiles () {
  const fileInput = document.querySelector('input[type="file"]')
  return fileInput.files
}
```

You can also manually create File objects using the native File constructor provided by the browser runtime. This is useful when you want to store data created by your application, instead of files from the user's computer.

```javascript
function makeFileObjects () {
  // You can create File objects from a Blob of binary data
  // see: https://developer.mozilla.org/en-US/docs/Web/API/Blob
  // Here we're just storing a JSON object, but you can store images,
  // audio, or whatever you want!
  const obj = { hello: 'world' }
  const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' })

  const files = [
    new File(['contents-of-file-1'], 'plain-utf8.txt'),
    new File([blob], 'hello.json')
  ]
  return files
}
```

In Node.js, the files-from-path library reads File objects from the local file system. The `filesFromPaths` helper asynchronously returns an array of Files that you can use directly with the `uploadDirectory` client method:

```javascript
import { filesFromPaths } from 'files-from-path'
```

You can also manually create File objects by importing a Node.js implementation of File from the Storacha package. This is useful when you want to store data created by your application, instead of files from the user's computer.

```javascript
async function getFiles (path) {
  const files = await filesFromPaths([path])
  console.log(`read ${files.length} file(s) from ${path}`)
  return files
}

function makeFileObjects () {
  // You can create File objects from a Buffer of binary data
  // see: https://nodejs.org/api/buffer.html
  // Here we're just storing a JSON object, but you can store images,
  // audio, or whatever you want!
  const obj = { hello: 'world' }
  const buffer = Buffer.from(JSON.stringify(obj))
  const files = [
    new File(['contents-of-file-1'], 'plain-utf8.txt'),
    new File([buffer], 'hello.json')
  ]
  return files
}
```

**Next Steps**

Learn more about how to fetch your data using the CID in the next section, retrieve.

#### How to Retrieve Data from Storacha

In this how-to guide, you'll learn several methods for retrieving data from Storacha.

All data stored using Storacha is made available for retrieval via IPFS, the InterPlanetary File System. IPFS is a distributed, peer-to-peer network for storing and sharing content-addressed data. This guide shows you several ways to retrieve your data from IPFS:

1. In your browser using an HTTP gateway.
2. In your terminal using the IPFS command-line tools.
3. In your terminal using curl or Powershell.

When retrieving any data, you'll be using the content CID of the upload (usually prefixed by `bafy…`).

**Using an IPFS HTTP Gateway**

You can easily fetch any data stored using Storacha using an IPFS HTTP gateway. Because IPFS is a peer-to-peer, decentralized network, you can use any public HTTP gateway to fetch your data. In this guide, we'll use the gateway at storacha.link (which is optimized for data stored with Storacha), but you can see more worldwide gateways on the IPFS Public Gateway Checker. To see the full set of parameters and options supported by our gateway, please check out the Trustless Gateway Specification.

You can use an IPFS gateway to view a list of all the files in that directory from your browser. To do so, simply create a gateway URL. For example, if your CID is `bafybeidd2gyhagleh47qeg77xqndy2qy3yzn4vkxmk775bg2t5lpuy7pcu`, you can make a URL for the storacha.link gateway as follows:

`https://bafybeidd2gyhagleh47qeg77xqndy2qy3yzn4vkxmk775bg2t5lpuy7pcu.ipfs.storacha.link/`

The storacha.link gateway has a rate limit of 200 requests per minute per IP.

If you want to link directly to a file within that directory, just add the file path after the CID portion of the link. For example: `bafybeidd2gyhagleh47qeg77xqndy2qy3yzn4vkxmk775bg2t5lpuy7pcu.ipfs.storacha.link/not-distributed.jpg` could be used as a shareable link for your new favorite wallpaper.

Your Storacha console page includes IPFS gateway links to all the content you've uploaded.

**Setting the filename**

When downloading files from an HTTP gateway, web browsers will set the default filename for the downloaded file based on the path component of the gateway link. For example, if you use your browser's "Save link as..." feature on the following link, it should prompt you to save a file named `treehouse.jpeg`:

`https://bafybeicfnbaeigdtklwkrj35r4wtfppix732zromsadvgiu33mowah74yq.ipfs.storacha.link/treehouse.jpeg`

In the link above, the CID `bafybeicfnbaeigdtklwkrj35r4wtfppix732zromsadvgiu33mowah74yq` points to an IPFS directory listing, which maps from the filename `treehouse.jpeg` to the CID for the image itself.

Since the Storacha client wraps your uploaded files in a directory by default, this is the most common kind of gateway link you're likely to need, and your users should get nice filenames when they download their content.

However, the behavior is a bit different if you make a gateway link directly to the image CID:

- `https://bafkreifvallbyfxnedeseuvkkswt5u3hbdb2fexcygbyjqy5a5rzmhrzei.ipfs.storacha.link`
- `https://ipfs.io/ipfs/bafkreifvallbyfxnedeseuvkkswt5u3hbdb2fexcygbyjqy5a5rzmhrzei`

Both of the URLs above link directly to the CID of the image, without an associated filename. The first URL uses the recommended "subdomain" URL format for gateway links, while the second form uses a "path prefix" format that you may see in use elsewhere in the IPFS ecosystem.

Depending on which style of link you use, your browser will prompt you to save a file with a generic name like `download`, or with the CID as the filename.

If you have such a link, you can override the default filename by adding a query string parameter to your link of the form `?filename=<desired-filename>`. For example, the following link will save as `treehouse.jpeg`, even though it links directly to the image by CID:

`https://bafkreifvallbyfxnedeseuvkkswt5u3hbdb2fexcygbyjqy5a5rzmhrzei.ipfs.storacha.link/?filename=treehouse.jpeg`

**Using the ipfs command**

If you have the IPFS command line interface installed, you can use it directly to fetch data without going through a gateway. This also works if you've installed IPFS Desktop, which includes the IPFS CLI.

To get the whole bundle and save it to a directory, run the following command:

```bash
ipfs get bafybeidd2gyhagleh47qeg77xqndy2qy3yzn4vkxmk775bg2t5lpuy7pcu
```

If you want to get a specific file out of the bundle, add its name onto the end of the `ipfs get bafybie...` command:

```bash
ipfs get bafybeidd2gyhagleh47qeg77xqndy2qy3yzn4vkxmk775bg2t5lpuy7pcu/youareanonsense.jpg
```

**Using curl**

Sometimes you may need to just download a specific file to your computer using the command line. Check out our example below.

1. Open a terminal window.
2. Use curl to download your file:

```bash
curl https://<YOUR_CID>.ipfs.storacha.link/<FILE_NAME> -o <OUTPUT_FILE>

# example
curl https://bafybeie2bjap32zi2yqh5jmpve5njwulnkualcbiszvwfu36jzjyqskceq.ipfs.storacha.link/example.txt -o ./output-file.txt
```

Replace `<YOUR_CID>`, `<FILE_NAME>`, and `<OUTPUT_FILE>` with their respective values.

| Variable | Replace with | Example |
|----------|--------------|---------|
| `<YOUR_CID>` | The CID of the file you want to download. | `bafybeie2bjap32zi2yqh5jmpve5njwulnkualcbiszvwfu36jzjyqskceq` |
| `<FILE_NAME>` | The name of the file that you originally uploaded to Storacha. | `example.txt` |
| `<OUTPUT_FILE>` | The path and filename that you want curl to save the file to. This can be different to `<FILE_NAME>`. | `./output-file.txt` |

We support downloading flat files out of the box. When downloading an extra large file or a directory, you may need to use `dag-scope=entity` in your request to avoid fetching the entire upload CAR:

`https://bafybeie2bjap32zi2yqh5jmpve5njwulnkualcbiszvwfu36jzjyqskceq.ipfs.storacha.link/?format=car&dag-scope=entity`

To see a full list of supported gateway options, check out the Trustless Gateway Specification.

**Next Steps**

Next, you'll learn about how to list uploaded content.

#### How to List Files Uploaded to Storacha

In this how-to guide, you'll learn about the different ways that you can list the files that you've uploaded to Storacha. Once you've stored some files using Storacha, you'll want to see a list of what you've uploaded. There are two ways you can do this:

1. Programmatically using the JS client or CLI
2. Using the Storacha console

**Using the JS Client or CLI**

You can also access a listing of your uploads from your code using the Storacha client. In the example below, this guide walks through how to use the JavaScript client library to fetch a complete listing of all the data you've uploaded using Storacha.

For instructions on how to set up your client instance or CLI, check out the Upload section.

Today, like other developer object storage solutions, there is no sorting or querying by timestamp to keep things scalable.

- **Client**: `client.capability.upload.list({ cursor: '', size: 25 })`
- **CLI**: `storacha ls`

In the client the listing is paginated. The result contains a cursor that can be used to continue listing uploads. Pass the cursor in the result as an option to the next call to receive the next page of results. The `size` option allows you to change the number of items that are returned per page.

In the CLI, you can use the `--shards` option to print for each upload the list of shards (CAR CIDs) that the uploaded data is contained within. You can learn about the relationship between uploads and shards in the Upload vs. Store section.

The `storacha ls` command automatically pages through the listing and prints the results.

**Listing shards**

Each upload is comprised of one or more shards. You can get a list of all shard CIDs in a Space, or look up what the shard CIDs are for an individual upload.

- **Client**: `client.capability.store.list({ cursor: '', size: 25 })`
- **CLI**: `storacha can store ls --cursor "" --size 25`

The listings are paginated. The result contains a cursor that can be used to continue listing uploads. Pass the cursor in the result as an option to the next call to receive the next page of results. The `size` option allows you to change the number of items that are returned per page.

A list of shards for a given upload can be retrieved like this:

- **Client**: `client.capability.upload.get(contentCID)`

You can learn about the relationship between uploads and shards in the Upload vs. Store section.

**Using the console web UI**

You can see a list of everything you've uploaded to Storacha in the console web app. If you don't need to work with this list programmatically, using the website may be a simpler choice.

This console provides a convenient overview of your stored data, including links to view your files in your browser via an IPFS gateway and information about how the data is being stored on the decentralized storage networks that Storacha uses under the hood.

#### Removing Data from your Account

You might want to remove data from being associated with your account. You can do so using the JS client, CLI, or web console.

Note that there is a minimum 30 day retention period for uploaded data, and even once removed, the data might persist on the public IPFS network.

**Public Data 🌎**

All data uploaded to the Storacha Network is available to anyone who requests it using the correct CID. Do not store any private or sensitive information in an unencrypted form using Storacha.

**Permanent Data ♾️**

Removing files from the Storacha Network will remove them from the file listing for your account, but that doesn't prevent nodes on the decentralized storage network from retaining copies of the data indefinitely. Storacha itself generally retains and charges users for any uploaded data for a minimum of 30 days. Do not use Storacha for data that may need to be permanently deleted in the future.

**Removing Uploads (content CIDs) vs. Blobs (shard CIDs)**

Storacha tracks two different things for its users to support content addressing. These concepts were first introduced in the Upload section:

- **Content CIDs**: The CIDs used to reference and access uploads in the format generally useful to users (e.g., files, directories). These CIDs are usually prefixed by `bafy…` or `bafk…`.
- **Shard CIDs**: The CID of the serialized shards of data itself (CAR files) that are produced client-side, sent to Storacha, and stored. These CIDs are prefixed by `bag…`.

Storacha tracks usage for payment (i.e., how much storage is utilized by a user) using the volume of data associated with shard CIDs. However, in general, most users will be interacting with content CIDs (this is how you fetch your data from the network), with shard CIDs more of an implementation detail (how data gets chunked, serialized into CAR files, and stored for uploads).

Fortunately, this shouldn't make things any more complicated - we go into more detail below, but in general, when you remove a content CID from your account, you'll want to remove the shard CIDs as well (e.g., in the client calling `client.remove(contentCID, { shards: true })`).

However, if you are a power user interacting with shard CIDs as well (e.g., using the client's `capability.blob.*` or CLI's `storacha can blob *` methods), then you need to be more cautious about removing shard CIDs from your account. (This is why the default for the client and CLI methods is for shards to be maintained after removing a content CID). You can read more about why you might want to interact with shard CIDs directly and the implications in the Upload vs. Store section.

**Using the JS Client or CLI**

If you followed the Upload section, you should already have your client or CLI set up with an Agent for your Space. From there, to remove a content CID from your account, you'll generally be using:

- **Client**: `client.remove(contentCID)`
- **CLI**: `storacha rm <contentCID>`

If you initially uploaded your content by using the recommended upload methods (e.g., used `client.uploadDirectory()` or `storacha up`) and didn't interact with CAR shards at all when uploading, we recommend removing the shard CIDs associated with the content CID from your account. Otherwise, you will still be paying for the data stored with Storacha (as mentioned above). The easiest way to do that is to set the `shards` option to `true`:

- **Client**: `client.remove(contentCID, { shards: true })`
- **CLI**: `storacha rm <contentCID> --shards`

**Removing content CIDs and shard CIDs separately**

If you have managed your shard CIDs and upload CIDs separately (e.g., used `client.capability.blob.add()` and `client.capability.upload.add()` in the client or `storacha can blob add` and `storacha can upload add` in the CLI), you might want to remove the upload CIDs and underlying shard CIDs separately as well. You can read more about why you might want to interact with shard CIDs directly and the implications in the Upload vs. Store section.

To remove shard CIDs and upload CIDs separately, you'll generally do this by:

1. Determine shards to remove (skip this step if you already know!):
   - **Client**: `client.capability.upload.list(contentCID)`
   - **CLI**: `storacha can upload ls <contentCID> --shards`
2. Remove the upload:
   - **Client**: `client.capability.upload.remove(contentCID)`
   - **CLI**: `storacha can upload rm <contentCID>`
3. Remove each of the shards (ensure first that no other content is using that shard!):
   - **Client**: `client.capability.blob.remove(shardMultihash)`
   - **CLI**: `storacha can blob rm <shardMultihash>`

#### Get Filecoin Information for a Piece

To retrieve a Data Aggregation Proof (including PoDSI) you can issue a `filecoin/info` invocation to the Storacha service.

**Using the JS Client**

Piece CIDs are calculated by the client before data is uploaded and are made available in the `onShardStored` callback of `uploadFile`, `uploadDirectory` or `uploadCAR`.

If you did not store the piece CID when your content was uploaded you can query the indexing service for an equivalency claim.

Later, you can use the piece CID to retrieve a Data Aggregation Proof:

```javascript
const result = await client.capability.filecoin.info(piece)
```

The result contains aggregate piece CIDs and inclusion proofs (PoDSI):

```javascript
for (const { aggregate, inclusion } of result.ok.aggregates) {
  console.log(`Aggregate CID: ${aggregate}`)
  console.log(`Inclusion Proof: ${inclusion}`)
}
```

Inclusion proofs can be verified using the `@web3-storage/data-segment` library:

```javascript
import { Proof, Piece } from '@web3-storage/data-segment'

const result = Proof.verify(inclusion.subtree, {
  tree: Piece.fromLink(aggregate).root,
  node: Piece.fromLink(piece).root
})
```

The result also contains details of storage providers and deals the aggregate appears in:

```javascript
for (const { provider, aux } of result.ok.deals) {
  console.log(`Storage Provider: f0${provider}`)
  console.log(`Deal ID: ${aux.dataSource.dealID}`)
}
```

**Using the CLI**

Piece CIDs are calculated by the client before data is uploaded and will be printed to the terminal if you pass the `--verbose` option to `storacha up`.

If you did not store the piece CID when your content was uploaded you can query the indexing service for an equivalency claim.

Later, you can use the piece CID to print out Data Aggregation Proof information:

```bash
$ storacha can filecoin info bafkzcibe52kq2dtip2bmrrw5qhphsa35onsxxvkuxl33dnotq2allfpz7tdxlhc5di

Piece CID: bafkzcibe52kq2dtip2bmrrw5qhphsa35onsxxvkuxl33dnotq2allfpz7tdxlhc5di
Deals: 
  Aggregate: bafkzcibcaapbrpjpxk32treyrtw5kamyh5ayxoj7rp4obkeoloydktubycnkufy
    Provider: 1392893
    Deal ID: 65895671

  Aggregate: bafkzcibcaapbrpjpxk32treyrtw5kamyh5ayxoj7rp4obkeoloydktubycnkufy
    Provider: 1771403
    Deal ID: 65895759

  Aggregate: bafkzcibcaapbrpjpxk32treyrtw5kamyh5ayxoj7rp4obkeoloydktubycnkufy
    Provider: 97777
    Deal ID: 65903995

  Aggregate: bafkzcibcaapbrpjpxk32treyrtw5kamyh5ayxoj7rp4obkeoloydktubycnkufy
    Provider: 717969
    Deal ID: 65922477

  Aggregate: bafkzcibcaapbrpjpxk32treyrtw5kamyh5ayxoj7rp4obkeoloydktubycnkufy
    Provider: 20378
    Deal ID: 65929686
```

#### Update your data with w3name

All the data you store on Storacha is content-addressed, which means that you always get location-independent, cryptographically verifiable links to your content.

Content addressing is a very powerful tool, but because the address is directly derived from the content, it is limited by definition to content that already exists, and any changes to the content will result in an entirely new address.

When you need to refer to something that might change over time, or that may not exist yet at all, content addressing alone isn't enough. You also need a way to update things as they change without breaking all of your links and references.

w3name is a service that provides secure, stable identifiers for data that changes over time (also known as "mutable" data). It uses the IPNS protocol to seamlessly interoperate with the IPFS network, so the links you create with w3name can be used with any IPFS client software or HTTP gateway.

All records created and updated using w3name are signed locally with each user's private publishing key. This means that the w3name service never sees your keys, and it also doesn't require any authentication to use - no account or API keys required!

In this guide, we'll discover how to use the JavaScript w3name package to create and manage name records for data stored with Storacha.

IPNS is a secure, local-first protocol, but does not always resolve performantly when needing to fetch the absolute latest update to a name (which is a requirement for most application use-cases) from the public IPFS network (e.g., over a local Kubo instance or public gateway). You can read more about this here.. As a result, w3name's recommended usage for use cases where performance and consistency are both important is via an endpoint hosted by Storacha. We plan on offering a new naming protocol at some point that can be used for application use cases without relying on any centralized infrastructure.

**What's in a name?**

w3name is similar to the Domain Name System (DNS), in that it allows you to query for an identifier and resolve the latest value. Unlike DNS, however, you cannot choose your own identifiers, and the "names" produced by IPNS and w3name are not human-readable, like `storacha` or `ipfs.io`.

The "names" in IPNS and w3name are unique identifiers, and each one is a string representation of the public half of a cryptographic key-pair.

Each "name" maps to a "record", which contains:

- The CID of the IPFS content that the name is pointing to.
- A sequence number and validity date.
- A verification signature, created using the private key, providing proof that this record was generated by the key holder.

Because the verification key is embedded in the name, all names created with w3name are "self-certifying," meaning that you can validate any record published to that name without needing any other authority or "source of truth" than the name itself.

**Getting started**

The easiest way to use the w3name service is with the w3name JavaScript library, which provides methods for creating, signing, publishing and resolving records.

**Install client library**

The w3name npm package provides a JavaScript / TypeScript API for creating and managing IPNS name records.

Install the library into your project.

```bash
npm install w3name
```

**Creating a new name**

You can create a new IPNS name with the `Name.create` function:

```javascript
const name = await Name.create();
```

You can see the name as a string by calling `.toString()` on it:

```javascript
console.log('created new name: ', name.toString());
// will print something similar to:
//  created new name: k51qzi5uqu5di9agapykyjh3tqrf7i14a7fjq46oo0f6dxiimj62knq13059lt
```

So far, the signing key for your new name only exists in memory. To save it for publishing updates, see Saving and loading keys below.

**Publishing the first revision**

We created a name, but so far there's no value associated with it.

To publish a value, we need to create a "revision." A revision contains a value that can be published to w3name, along with some IPNS metadata. All revisions have a sequence number that gets incremented each time the name is updated with a new value.

To create the initial revision for a name, use the `Name.v0` function:

```javascript
// value is an IPFS path to the content we want to publish
const value = '/ipfs/bafkreiem4twkqzsq2aj4shbycd4yvoj2cx72vezicletlhi7dijjciqpui';
// since we don't have a previous revision, we use Name.v0 to create the initial revision
const revision = await Name.v0(name, value);
```

We now have a revision object that's ready to publish, but so far it's only in memory on our local machine. To publish the value to the network, use `Name.publish`:

```javascript
await Name.publish(revision, name.key);
```

**Publishing an updated revision**

Each revision contains a sequence number, which must be incremented when publishing a new revision. Once you've published the initial revision, you can use the `Name.increment` function to create a new revision based on the previously published one.

For example, if our initial revision is stored in a variable called `revision`, we can create a new revision `nextRevision` using `Name.increment`:

```javascript
const nextValue = '/ipfs/bafybeiauyddeo2axgargy56kwxirquxaxso3nobtjtjvoqu552oqciudrm';
// Make a revision to the current record (increments sequence number and sets value)
const nextRevision = await Name.increment(revision, nextValue);
```

Publication works the same as with the initial revision:

```javascript
await Name.publish(nextRevision, name.key);
```

If you no longer have the old revision locally, you can resolve the current value and use the returned revision as input to `Name.increment`.

Note that you must have the original signing key in order to publish updates. See Saving and loading keys below to learn about key management.

**Getting the latest revision**

You can resolve the current value for any name using the `Name.resolve` function.

```javascript
const name = Name.parse('k51qzi5uqu5di9agapykyjh3tqrf7i14a7fjq46oo0f6dxiimj62knq13059lt');
const revision = await Name.resolve(name);
console.log('Resolved value:', revision.value);
```

**Saving and loading keys**

To create revisions to a name after publication, you'll need the original signing key. You can get the binary representation of a name with the `key.bytes` property, which can then be saved to disk or stored in a secure key management system.

```javascript
import fs from 'fs';

async function saveSigningKey(name, outputFilename) {
  const bytes = name.key.bytes;
  await fs.promises.writeFile(outputFilename, bytes);
}
```

Later, you can use `Name.from` to convert from the binary representation to an object suitable for publishing revisions.

```javascript
import fs from 'fs';

async function loadSigningKey(filename) {
  const bytes = await fs.promises.readFile(filename);
  const name = await Name.from(bytes);
  return name;
}
```

Be careful where you save your keys! Your private signing keys allow the holder to update your published records. Be careful to save your keys to a secure location, and never store your private keys in a source code repository.

**Rate limits**

The w3name API is rate limited at 30 requests per 10 seconds per IP.

#### How to Upload from CI

Publish files to IPFS and Filecoin via Storacha from a Continuous Integration server.

Using the CLI locally, the steps are:

1. Create a space that you want CI to upload to (or use an existing one)
2. Create a signing key for CI to use with `storacha key create`
3. Create a proof that delegates capabilities to upload to your space to that key

Then in the CI environment:

1. Install the CLI tool from npm
2. Import the signing key by setting it as `STORACHA_PRINCIPAL` in the env
3. Import the proof by passing it to `storacha space add`
4. Upload your files with `storacha up`

Using Github? Use the add-to-web3 Action https://github.com/marketplace/actions/add-to-web3

**Example**

Using the CLI, create a signing key and a proof:

```bash
# Create key and did. Use the output `key` value as STORACHA_PRINCIPAL in CI.
$ storacha key create --json > ci-key.json

# Extract the did as $AUDIENCE
$ AUDIENCE=$(jq -r .did ci-key.json)

# Create a signed proof that you delegate capabilties to that key. 
$ storacha delegation create $AUDIENCE -c space/blob/add -c space/index/add -c filecoin/offer -c upload/add --base64
mAYIEAP8OEaJlcm9vdHOAZ3ZlcnNpb24BwwUBcRIg+oHTbzShh1WzBo9ISkonCW+KAcy/+zW8Zb...

# Pass the output to `storacha space add` in ci
```

Then on the CI side (in github flavour)

```yaml
steps:
  - run: npm install -g @storacha/cli

  - run: storacha space add ${{ inputs.proof }}
    env:
      STORACHA_PRINCIPAL: ${{ inputs.secret_key }}

  - run: storacha up ${{ inputs.path_to_add }}
    env:
      STORACHA_PRINCIPAL: ${{ inputs.secret_key }}
```

The rest of this document explains the process in more detail.

**Create a space**

On your local machine with the Storacha CLI installed and logged in (see: /quickstart/) run

```bash
$ storacha space create
```

and follow the instructions. (See: /how-to/create-space/#using-the-cli if you get stuck.)

If you want to use an existing space, make sure it is set as your current space using `storacha space ls` and `storacha space use`

**Create a signing key**

On your local machine, use the Storacha CLI to generate a new a new Ed25519 private signing key for CI to use.

```bash
# Use the `did` in the input to the next command. 
# Use `key` as your `secret_key` for add_to_web3.
$ storacha key create --json
{
  "did": "did:key:z6Mk...",
  "key": "MgCaT7Se2QX9..."
}
```

Keep the key safe. It will be used by CI to sign requests to Storacha.

The `did` from the command above is the public decentralized identifier for that private key.

**Create a proof**

On your local machine, use the Storacha CLI to delegate capabilties to upload to our space to the public DID for the signing key we created.

Our CI environment doesn't need to list our uploads or change our billing plan so we only delegate the `space/blob/add`, `space/index/add`, `filecoin/offer` and `upload/add` capabilities to it.

Pass the `did` for the signing key as the audience parameter. We are delegating capabilities to that key.

```bash
$ AUDIENCE=did:key:z6Mk...

# Delegate capabilities to the `did` we created above.
$ storacha delegation create $AUDIENCE -c space/blob/add -c space/index/add -c filecoin/offer -c upload/add --base64
mAYIEAP8OEaJlcm9vdHOAZ3ZlcnNpb24BwwUBcRIg+oHTbzShh1WzBo9ISkonCW+KAcy/+zW8Zb...
```

The output is a base64 encoded UCAN proof, signed by your local key. It can only be used as proof by the signing key we specified by the DID we passed in.

Now we have a signing key and a proof we can use in the CI environment.

**Install the Storacha CLI in CI**

Install it from npm with the `--global` flag to make the `storacha` command available.

```bash
$ npm i --global @storacha/cli
```

**Import the signing key**

Set `STORACHA_PRINCIPAL=<the signing key>` in the CI environment. The `storacha` commmand will use the value as the signing key to use. see: https://github.com/storacha/upload-service/tree/main/packages/cli#storacha\_principal

The value is the key we created above with `storacha key create`. The key must be the one for the `did` that was used to create the proof.

**Import the proof**

Set `STORACHA_PROOF=<the proof>` in the CI environment.

In your CI job definition, run the `storacha space add` command to import the proof that it can upload to the space we created.

```bash
$ storacha space add $STORACHA_PROOF
```

**Upload your files**

In your CI job definition, run the `storacha up` command to upload the files you want to publish on IPFS and store in Filecoin.

```bash
$ storacha up <path to files>
```

that path might be the `dist` or `output` directory of a previous step that built your static website or collected some stats from a job.

Once that command returns succesfully, you are done, your files are content addressed and available over IPFS.

If you want to capture the CID for your uploads pass the `--json` flag and use jq to extract it

```bash
# write the output as json to a file
$ storacha up <path to files> --json > ./storacha_up_output.json

# extract the root cid from the output and set it as an env var.
$ CID=$(jq --raw-output '.root."/"' ./storacha_up_output.json)
```

**Github Action: add-to-web3**

The add-to-web3 action is a lightweight wrapper around the Storacha CLI. You create the key and proof as before, and the action configures and runs storacha in CI for you.

Use it in your Github Workflow like this

```yaml
uses: storacha/add-to-web3@v3
id: storacha
with:
  path_to_add: 'dist'
  secret_key: ${{ secrets.STORACHA_PRINCIPAL }}
  proof: ${{ secrets.STORACHA_PROOF }}

# use the outputs in subsequent steps
# "bafkreicysg23kiwv34eg2d7qweipxwosdo2py4ldv42nbauguluen5v6am"
- run: echo ${{ steps.storacha.outputs.cid }}

# "https://bafkreicysg23kiwv34eg2d7qweipxwosdo2py4ldv42nbauguluen5v6am.ipfs.storacha.link"
- run: echo ${{ steps.storacha.outputs.url }}
```

It uploads `path_to_add` to Storacha.

It outputs the root CID as `cid` and IPFS Gateway URL as `url` for subsequent steps in your workflow to use.

---

## API Reference

### @storacha/client

`@storacha/client` is a JavaScript library that provides a convenient interface to the Storacha platform, a simple "on-ramp" to the content-addressed decentralized IPFS network. Learn more...

⚠️❗ **Public Data 🌎**: All data uploaded to Storacha is available to anyone who requests it using the correct CID. Do not store any private or sensitive information in an unencrypted form using Storacha.

⚠️❗ **Permanent Data ♾️**: Removing files from Storacha will remove them from the file listing for your account, but that doesn't prevent nodes on the decentralized storage network from retaining copies of the data indefinitely. Do not use Storacha for data that may need to be permanently deleted in the future.

### Install

You can add the `@storacha/client` package to your JavaScript or TypeScript project with npm:

```bash
npm install @storacha/client
```

Note: a modern browser or Node 18+ is required.

### Usage

**Example**

```javascript
import * as Client from '@storacha/client'

const client = await Client.create()

// Note: first time setup is required - either login or load delegations, see:
// https://docs.storacha.network/how-to/upload/

const root = await client.uploadDirectory([new File(['Hello World!'], 'hello.txt')])

// `root` is a CID - a hash of the data, use it in an IPFS gateway URL to access:
console.log(`https://storacha.link/ipfs/${root}/hello.txt`)
```

### API

#### create

**Client**

```typescript
function create(options?: ClientFactoryOptions): Promise<Client>
```

Create a new Storacha client.

If no backing store is passed one will be created that is appropriate for the environment.

If the backing store is empty, a new signing key will be generated and persisted to the store. In the browser an unextractable RSA key will be generated by default. In other environments an Ed25519 key is generated.

If the backing store already has data stored, it will be loaded and used.

More information: ClientFactoryOptions

#### uploadDirectory

```typescript
function uploadDirectory(
  files: File[],
  options: {
    retries?: number
    signal?: AbortSignal
    onShardStored?: ShardStoredCallback
    shardSize?: number
    dedupe?: boolean
  } = {}
): Promise<CID>
```

Uploads a directory of files to the service and returns the root data CID for the generated DAG. All files are added to a container directory, with paths in file names preserved.

More information: ShardStoredCallback

#### uploadFile

```typescript
function uploadFile(
  file: Blob,
  options: {
    retries?: number
    signal?: AbortSignal
    onShardStored?: ShardStoredCallback
    shardSize?: number
    dedupe?: boolean
  } = {}
): Promise<CID>
```

Uploads a file to the service and returns the root data CID for the generated DAG.

More information: ShardStoredCallback

#### uploadCAR

```typescript
function uploadCAR(
  car: Blob,
  options: {
    retries?: number
    signal?: AbortSignal
    onShardStored?: ShardStoredCallback
    shardSize?: number
    rootCID?: CID
    dedupe?: boolean
  } = {}
): Promise<CID>
```

Uploads a CAR file to the service. The difference between this function and `capability.store.add` is that the CAR file is automatically sharded and an "upload" is registered (see `capability.upload.add`), linking the individual shards. Use the `onShardStored` callback to obtain the CIDs of the CAR file shards.

More information: ShardStoredCallback

#### agent

```typescript
agent: Signer
```

The user agent. The agent is a signer - an entity that can sign UCANs with keys from a Principal using a signing algorithm.

#### login

```typescript
function login(
  email: string,
  options?: { signal?: AbortSignal }
): Promise<void>
```

Authorize the current agent to use capabilities granted to the passed email account.

#### accounts

```typescript
function accounts(): Record<DID, Account>
```

List all accounts the agent has stored access to.

#### currentSpace

```typescript
function currentSpace(): Space | undefined
```

The current space in use by the agent.

#### setCurrentSpace

```typescript
function setCurrentSpace(did: DID): Promise<void>
```

Use a specific space.

#### spaces

```typescript
function spaces(): Space[]
```

Spaces available to this agent.

#### createSpace

```typescript
async function createSpace(
  name?: string,
  options?: { account: Account }
): Promise<Space>
```

Create a new space with an optional name.

#### addSpace

```typescript
async function addSpace(proof: Delegation): Promise<Space>
```

Add a space from a received proof. Proofs are delegations with an audience matching the agent DID.

#### proofs

```typescript
function proofs(capabilities?: Capability[]): Delegation[]
```

Get all the proofs matching the capabilities. Proofs are delegations with an audience matching the agent DID.

More information: Capability

#### addProof

```typescript
function addProof(proof: Delegation): Promise<void>
```

Add a proof to the agent. Proofs are delegations with an audience matching the agent DID. Note: `addSpace` should be used for delegating from Space to Agent (i.e., you want the Agent to fully be able to act on behalf of the Space), as it calls `addProof` with some additional client logic. `addProof` is for more generically adding delegations to the Agent (e.g., delegation targets a resource other than a Space).

#### delegations

```typescript
function delegations(capabilities?: Capability[]): Delegation[]
```

Get delegations created by the agent for others. Filtered optionally by capability.

More information: Capability

#### createDelegation

```typescript
function createDelegation(
  audience: Principal,
  abilities: string[],
  options?: UCANOptions
): Promise<Delegation>
```

Create a delegation to the passed audience for the given abilities with the current space as the resource.

#### remove

```typescript
function remove (
  contentCID?: CID
  options: {
    shards?: boolean
  } = {}
): Promise<void>
```

Removes association of a content CID with the space. Optionally, also removes association of CAR shards with space.

⚠️ If `shards` option is `true` all shards will be deleted even if there is another upload(s) that reference same shards, which in turn could corrupt those uploads.

#### getReceipt

```typescript
function getReceipt(taskCid: CID): Promise<Receipt>
```

Get a receipt for an executed task by its CID.

#### capability.access.authorize

```typescript
function authorize(
  email: string,
  options: { signal?: AbortSignal } = {}
): Promise<void>
```

Authorize the current agent to use capabilities granted to the passed email account.

#### capability.access.claim

```typescript
function claim(): Promise<Delegation<Capabilities>[]>
```

Claim delegations granted to the account associated with this agent. Note: the received delegations are added to the agent's persistent store.

#### capability.blob.add

```typescript
function add(
  blob: Blob,
  options: { retries?: number; signal?: AbortSignal } = {}
): Promise<MultihashDigest>
```

Store a blob to the service.

#### capability.blob.list

```typescript
function list(
  options: { retries?: number; signal?: AbortSignal } = {}
): Promise<ListResponse<BlobListResult>>
```

List blobs stored in the current space.

More information: BlobListResult, ListResponse

#### capability.blob.remove

```typescript
function remove(
  digest: MultihashDigest,
  options: { retries?: number; signal?: AbortSignal } = {}
): Promise<void>
```

Remove a stored blob by multihash digest.

#### capability.index.add

```typescript
function add(
  index: CID,
  options: { retries?: number; signal?: AbortSignal } = {}
): Promise<IndexAddResponse>
```

Register an "index" with the service. The index CID should be the CID of a CAR file, containing an index ad defined by w3-index.

Required delegated capability proofs: `index/add`

#### capability.plan.get

```typescript
function get(account: AccountDID): Promise<PlanGetSuccess>
```

Get information about an account's billing plan.

#### capability.plan.set

```typescript
function set(account: AccountDID, product: DID): Promise<{}>
```

Switch an account's "plan" to the given product. This may result in changes to your billing or unexpected billing cycles depending on the type of change.

#### capability.plan.createAdminSession

```typescript
function createAdminSession(
  account: AccountDID,
  returnURL: string
): Promise<{ url: string }>
```

Create a billing customer portal admin session. Returns a URL that the customer can visit to administer account. Design and implementation driven by our Stripe integration and may not be supported by all billing providers.

#### capability.space.info

```typescript
function info(): Promise<SpaceInfo>
```

Get information about the current space.

#### capability.upload.add

```typescript
function add(
  root: CID,
  shards: CID[],
  options: { retries?: number; signal?: AbortSignal } = {}
): Promise<UploadAddResponse>
```

Register a set of stored CAR files as an "upload" in the system. A DAG can be split between multiple CAR files. Calling this function allows multiple stored CAR files to be considered as a single upload.

#### capability.upload.list

```typescript
function list(
  options: { cursor?: string, size?: number, retries?: number; signal?: AbortSignal } = {}
): Promise<ListResponse<UploadListResult>>
```

List uploads created in the current space.

More information: UploadListResult, ListResponse

#### capability.upload.remove

```typescript
function remove(
  link: CID,
  options: { retries?: number; signal?: AbortSignal } = {}
): Promise<void>
```

Remove a upload by root data CID.

#### capability.filecoin.offer

```typescript
function offer(content: CID, piece: PieceLink): Promise<FilecoinOfferResponse>
```

Offer a Filecoin "piece" to be added to an aggregate that will be offered for Filecoin deal(s).

#### capability.filecoin.info

```typescript
function info(piece: PieceLink): Promise<FilecoinInfoResponse>
```

Get know deals and aggregate info of a Filecoin "piece" previously offered.

#### capability.usage.report

```typescript
function report(
  space: DID,
  period: { from: Date, to: Date },
  options?: { nonce?: string }
): Promise<UsageReportSuccess>
```

Get a usage report for the passed space in the given time period.

More information: UsageReportSuccess

### Types

#### BlobListResult

```typescript
interface BlobListResult {
  blob: {
    digest: Uint8Array
    size: number
  }
}
```

#### Capability

An object describing a UCAN capability, which specifies what action the UCAN holder can perform with some resource.

Defined by the `@ipld/dag-ucan` package.

```typescript
interface Capability<
  Can extends Ability = Ability,
  With extends Resource = Resource,
  Caveats extends unknown = unknown
> {
  with: With
  can: Can
  nb?: Caveats
}

type Ability = `${string}/${string}` | '*'

type Resource = `${string}:${string}`
```

The `can` field contains a string ability identifier, e.g. `blob/add` or `space/info`.

The `with` field contains a resource URI, often a `did:key` URI that identifies a Space.

The optional `nb` (nota bene) field contains "caveats" that add supplemental information to a UCAN invocation or delegation.

See the `@storacha/capabilities` package for more information about capabilities and how they are defined in Storacha services.

#### CARMetadata

Metadata pertaining to a CAR file.

```typescript
interface CARMetadata {
  /**
   * CAR version number.
   */
  version: number
  /**
   * Root CIDs present in the CAR header.
   */
  roots: CID[]
  /**
   * CID of the CAR file (not the data it contains).
   */
  cid: CID
  /**
   * Size of the CAR file in bytes.
   */
  size: number
}
```

#### ClientFactoryOptions

Options for creating a new Storacha client.

```typescript
interface ClientFactoryOptions {
  /**
   * A storage driver that persists exported agent data.
   */
  store?: Driver<AgentDataExport>
  /**
   * Use this principal to sign UCANs. Note: if the store is non-empty and the
   * principal saved in the store is not the same principal as the one passed
   * here an error will be thrown.
   */
  principal?: Signer<DID>
}
```

See the storage driver docs for the types of storage driver available. If a store is not specified a store appropriate for the environment is picked.

#### Delegation

An in-memory view of a UCAN delegation, including proofs that can be used to invoke capabilities or delegate to other agents.

```typescript
import { Delegation as CoreDelegation } from '@ucanto/core/delegation'
export interface Delegation extends CoreDelegation {
  /**
   * User defined delegation metadata.
   */
  meta(): Record<string, any>
}
```

The Delegation type in `@storacha/client` extends the Delegation type defined by ucanto:

```typescript
export interface Delegation<C extends Capabilities = Capabilities> {
  readonly root: UCANBlock<C>
  readonly blocks: Map<string, Block>

  readonly cid: UCANLink<C>
  readonly bytes: ByteView<UCAN.UCAN<C>>
  readonly data: UCAN.View<C>

  asCID: UCANLink<C>

  export(): IterableIterator<Block>

  issuer: UCAN.Principal
  audience: UCAN.Principal
  capabilities: C
  expiration?: UCAN.UTCUnixTimestamp
  notBefore?: UCAN.UTCUnixTimestamp

  nonce?: UCAN.Nonce

  facts: Fact[]
  proofs: Proof[]
  iterate(): IterableIterator<Delegation>
}
```

Delegations can be serialized by calling `export()` and piping the returned Block iterator into a CarWriter from the `@ipld/car` package.

#### Driver

Storage drivers persist data created and managed by an agent. Currently 3 storage drivers are available:

- **Conf** (`@storacha/client/stores/conf`) - a store for use in Node.js that is backed by the conf module.
- **IndexedDB** (`@storacha/client/stores/indexeddb`) - a browser only store for persiance backed by IndexedDB.
- **Memory** (`@storacha/client/stores/memory`) - in memory store for clients that load state from environment variables/secrets, ephemeral clients and for testing. Note: not persisted!

#### ListResponse

A paginated list of items.

```typescript
interface ListResponse<R> {
  cursor?: string
  size: number
  results: R[]
}
```

#### ServiceConf

Service DID and URL configuration.

#### ShardStoredCallback

A function called after a DAG shard has been successfully stored by the service:

```typescript
type ShardStoredCallback = (meta: CARMetadata) => void
```

More information: CARMetadata

#### Space

An object representing a storage location. Spaces must be registered with the service before they can be used for storage.

```typescript
interface Space {
  /**
   * The given space name.
   */
  name(): string

  /**
   * The DID of the space.
   */
  did(): string

  /**
   * Whether the space has been registered with the service.
   */
  registered(): boolean

  /**
   * User defined space metadata.
   */
  meta(): Record<string, any>
}
```

#### UploadListResult

```typescript
interface UploadListResult {
  root: CID
  shards?: CID[]
}
```

#### UsageReportSuccess

```typescript
type UsageReportSuccess = Record<DID, UsageData>

interface UsageData {
  /** Provider the report concerns, e.g. `did:web:storacha.network` */
  provider: DID
  /** Space the report concerns. */
  space: DID
  /** Period the report applies to. */
  period: {
    /** ISO datetime the report begins from (inclusive). */
    from: ISO8601Date
    /** ISO datetime the report ends at (inclusive). */
    to: ISO8601Date
  }
  /** Observed space size for the period. */
  size: {
    /** Size at the beginning of the report period. */
    initial: number
    /** Size at the end of the report period. */
    final: number
  }
  /** Events that caused the size to change during the period. */
  events: Array<{
    /** CID of the invoked task that caused the size to change. */
    cause: Link
    /** Number of bytes that were added or removed. */
    delta: number
    /** ISO datetime that the receipt was issued for the change. */
    receiptAt: ISO8601Date
  }>
}
```

---

## Contributing

Thank you for your interest in contributing to Storacha! We welcome contributions from the community.

