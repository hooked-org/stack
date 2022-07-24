// import { useCallback, useEffect, useRef, useState } from "react";

import { useState } from "react";

export default function CodeSample() {
  const [selectedSample, setSelectedSample] = useState(0);

  const samples = [
    {
      name: "JavaScript",
      component: <JavaScriptSample />
    },
    {
      name: "CURL",
      component: <CURLSample />
    }
  ]

  return (
    <div className="bg-[#272833] text-sm p-5 pt-3 mt-8 lg:mt-0 lg:ml-24 w-[510px] pr-12 rounded-xl">
      <div className="text-gray-200 mb-3 -ml-2">
        {samples.map((sample, index) => (
          <span
            key={sample.name}
            onClick={() => setSelectedSample(index)}
            className={`mr-2 p-1 px-2 rounded cursor-pointer ${selectedSample === index && 'bg-[#383742]'}`}
          >{sample.name}</span>
        ))}
      </div>

      {samples[selectedSample].component}
    </div>
  );
}

function JavaScriptSample() {
  return (
    <code>
      <pre>
        <span className="keyword">import</span>
        <span> Hooked</span>
        <span className="keyword"> from</span>
        <span className="string"> "hooked.sh"</span>
      </pre>
      <br />
      <pre>
        <span className="keyword">const</span>
        <span> hooked =</span>
        <span className="keyword"> new</span>
        <span className="identifier"> Hooked</span>
        <span>(</span>
        <span className="string">"hook_9Z..A0"</span>
        <span>)</span>
      </pre>
      <pre>
        <span>hooked.</span>
        <span className="identifier">on</span>
        <span>(</span>
        <span className="string">"message"</span>
        <span>{', (data) => {'}</span>
      </pre>
      <pre>
        <span>  hooked.</span>
        <span className="identifier">send</span>
        <span>(</span>
        <span className="string">`echo </span>
        <span className="keyword">{'${'}</span>
        <span>data</span>
        <span className="keyword">{'}'}</span>
        <span>)</span>

      </pre>
      <pre>
        <span>{'})'}</span>
      </pre>
      <br />
      <pre>
        <span className="keyword">export default </span>
        <span>hooked.handler</span>
      </pre>
    </code>
  )
}

function CURLSample() {
  return (
    <code>
      <pre>
        <span className="keyword">curl </span>
        <span className="comment">\</span>
      </pre>
      <pre>
          <span>  -H </span>
          <span className="string">"Authorization: Bearer hook_9Z..A0" </span>
          <span className="comment">\</span>
      </pre>
      <pre>
          <span>  -X </span>
          <span className="identifier">POST </span>
          <span className="string">https://hooked.sh/ </span>
          <span className="comment">\</span>
      </pre>
      <pre>
          <span>  -H </span>
          <span className="string">"Content-Type: application/json" </span>
          <span className="comment">\</span>
      </pre>
      <pre>
        <span>  -d </span>
        <span className="string">{`'{"url":"ws://...", "callback":"https://..."}'`}</span>
      </pre>
    </code>
  )
}