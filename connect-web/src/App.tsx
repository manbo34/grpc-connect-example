import { useState } from 'react'
import './App.css'

import { createPromiseClient } from "@bufbuild/connect";
import { createConnectTransport } from "@bufbuild/connect-web";
import {GreetStreamService} from "./v1/greet_connect";


// Import service definition that you want to connect to.
// import { ElizaService } from "@buf/bufbuild_eliza.bufbuild_connect-es/buf/connect/demo/eliza/v1/eliza_connect";

// The transport defines what type of endpoint we're hitting.
// In our example we'll be communicating with a Connect endpoint.
const transport = createConnectTransport({
  baseUrl: "http://localhost:8080",
});

// Here we make the client itself, combining the service
// definition with the transport.
const client = createPromiseClient(GreetStreamService, transport);

function App() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<
    {
      fromMe: boolean;
      message: string;
    }[]
  >([]);
  return <>
    <ol>
      {messages.map((msg, index) => (
        <li key={index}>
          {`${msg.fromMe ? "ME:" : "ELIZA:"} ${msg.message}`}
        </li>
      ))}
    </ol>
    <form onSubmit={async (e) => {
      e.preventDefault();
      // Clear inputValue since the user has submitted.
      setInputValue("");
      // Store the inputValue in the chain of messages and
      // mark this message as coming from "me"
      setMessages((prev) => [
        ...prev,
        {
          fromMe: true,
          message: inputValue,
        },
      ]);
      const headers = new Headers();
      headers.set("user_id", "AbCdEf123456");
      headers.set("Authorization", "Bearer AbCdEf123456");
      console.log("headers", headers.get("user_id"))
      // const response = await client.greetStream({
      //   name: inputValue
      // }, {headers: headers});
      for await (const res of client.greetStream({ name: inputValue }, {headers: headers})) {
        console.log(res);
        setMessages((prev) => [
          ...prev,
          {
            fromMe: false,
            message: res.greeting,
          },
        ]);
      }
      // setMessages((prev) => [
      //   ...prev,
      //   {
      //     fromMe: false,
      //     message: response.greeting,
      //   },
      // ]);
    }}>
      <input value={inputValue} onChange={e => setInputValue(e.target.value)} />
      <button type="submit">Send</button>
    </form>
  </>;
}

export default App