import { Web3 } from "web3";
import { Network, Alchemy } from 'alchemy-sdk';
import pkg from '@alch/alchemy-web3';
import { Actor, HttpAgent } from'@dfinity/agent';
import { w3nsIdlFactory } from './w3ns.js';
import fetch from 'node-fetch';
// const W3NS_CANISTER_ID = 'rrkah-fqaaa-aaaaa-aaaaq-cai'; // LOCAL
const W3NS_CANISTER_ID = 'tgvjf-kaaaa-aaaah-ab2tq-cai'; // IC
global.fetch = fetch;
const { createAlchemyWeb3 } = pkg;

const enqueueEmailNotification = async (sendEmailInput) => {
    const agent = new HttpAgent({
        host: 'https://ic0.app',
        // host: 'http://127.0.0.1:4000',
    });

    agent.fetchRootKey();

    const actor = Actor.createActor(w3nsIdlFactory, {
        agent,
        canisterId: W3NS_CANISTER_ID,
    });

    const result = await actor.enqueue_eth_email_notification(sendEmailInput.from, {
        to: sendEmailInput.to,
        title: sendEmailInput.title,
        body: sendEmailInput.body,
    });

    console.log(result);
}

const enqueueSmsNotification = async (sendSmsInput) => {
    const agent = new HttpAgent({
        host: 'https://ic0.app',
        // host: 'http://127.0.0.1:4000',
    });

    const actor = Actor.createActor(w3nsIdlFactory, {
        agent,
        canisterId: W3NS_CANISTER_ID,
    });

    const result = await actor.enqueue_eth_sms_notification(sendSmsInput.from, {
        to: sendSmsInput.to,
        message: sendSmsInput.message,
    });
}

const contractAddress = '0xc78d27fb9d1A62B899f8b22eD36F73Af88BD4d4e';

const provider = createAlchemyWeb3('https://polygon-mumbai.g.alchemy.com/v2/jvd4nfLdTunTOrdyfP_w5yLnyrDDHMu5');
const web3 = new Web3(provider);

const EMAIL_SENT_TOPIC = '0x9f1669740eb35d0c317af992d03c42e3914e7aef7bc104aa4926b611b258e869';
const SMS_SENT_TOPIC = '0x4a5815fdda527f7ddc10c4cbd9228ab19f7c6247f8e2b2a00a97c411f5cdac46';

const EmailSentEvents = {
    address: contractAddress,
    topics: [EMAIL_SENT_TOPIC]
};

const SmsSentEvents = {
    address: contractAddress,
    topics: [SMS_SENT_TOPIC]
};

const settings = {
    apiKey: "jvd4nfLdTunTOrdyfP_w5yLnyrDDHMu5", // Replace with your Alchemy API Key.
    network: Network.MATIC_MUMBAI, // Replace with your network.
  };

const alchemy = new Alchemy(settings);

const handleEmailSentEvent = async (txn) => {
    console.log(txn);
    console.log('Email sent');
    const decodedEmailSentdData = web3.eth.abi.decodeParameters(['address', 'string', 'string', 'string'], txn.data);
    const sendEmailInput = {
        from: decodedEmailSentdData[0],
        to: decodedEmailSentdData[1],
        title: decodedEmailSentdData[2],
        body: decodedEmailSentdData[3]
    };
    console.log(decodedEmailSentdData);
    console.log(sendEmailInput);
    await enqueueEmailNotification(sendEmailInput);
};

const handleSmsSentEvent = async (txn) => {
    console.log(txn);
    console.log('SMS sent');
    const decodedSmsSentData = web3.eth.abi.decodeParameters(['address', 'string', 'string'], txn.data);
    const sendSmsInput = {
        from: decodedSmsSentData[0],
        to: decodedSmsSentData[1],
        message: decodedSmsSentData[2]
    };
    console.log(decodedSmsSentData);
    console.log(sendSmsInput);
    await enqueueSmsNotification(sendSmsInput);
};


alchemy.ws.on(EmailSentEvents, handleEmailSentEvent);
alchemy.ws.on(SmsSentEvents, handleSmsSentEvent);
