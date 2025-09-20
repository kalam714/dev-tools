// src/pages/JwtInspector.jsx
import React, { useMemo, useState } from "react";

/**
 * JWT Inspector (React)
 *
 * - Paste a JWT into the textarea and it decodes header/payload and shows signature part.
 * - Shows exp/nbf/iat in human-readable form and warns if token expired/not yet valid.
 * - Can verify signatures:
 *    - HS256: provide the secret (shared HMAC secret)
 *    - RS256: provide the public RSA key in PEM format (SPKI)
 * - Uses WebCrypto (window.crypto.subtle). No server-side needed.
 *
 * Notes:
 * - For RS256, paste a public key PEM (-----BEGIN PUBLIC KEY----- ... -----END PUBLIC KEY-----).
 * - This is a debugging tool. Do not paste real secrets in public/shared environments.
 */

function b64UrlToUint8Array(b64UrlString) {
  // base64url -> base64
  let b64 = b64UrlString.replace(/-/g, "+").replace(/_/g, "/");
  // pad
  while (b64.length % 4) b64 += "=";
  const binary = atob(b64);
  const len = binary.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

function base64UrlDecodeToString(b64Url) {
  try {
    const u8 = b64UrlToUint8Array(b64Url);
    const decoder = new TextDecoder();
    return decoder.decode(u8);
  } catch (e) {
    return null;
  }
}

function prettyJson(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

async function verifyHS256(secret, signingInput, signatureU8) {
  // secret: string
  // signingInput: string (header.payload)
  // signatureU8: Uint8Array
  try {
    const enc = new TextEncoder();
    const keyData = enc.encode(secret);
    const key = await window.crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["verify", "sign"]
    );
    const signatureValid = await window.crypto.subtle.verify(
      { name: "HMAC", hash: "SHA-256" },
      key,
      signatureU8,
      new TextEncoder().encode(signingInput)
    );
    return { ok: signatureValid, alg: "HS256" };
  } catch (err) {
    return { ok: false, error: err.message || String(err), alg: "HS256" };
  }
}

function pemToArrayBuffer(pem) {
  // remove header/footer
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\s+/g, "");
  return b64UrlToUint8Array(b64).buffer;
}

async function verifyRS256(publicKeyPem, signingInput, signatureU8) {
  try {
    const spki = pemToArrayBuffer(publicKeyPem);
    const key = await window.crypto.subtle.importKey(
      "spki",
      spki,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: { name: "SHA-256" },
      },
      false,
      ["verify"]
    );

    const ok = await window.crypto.subtle.verify(
      { name: "RSASSA-PKCS1-v1_5" },
      key,
      signatureU8,
      new TextEncoder().encode(signingInput)
    );
    return { ok, alg: "RS256" };
  } catch (err) {
    return { ok: false, error: err.message || String(err), alg: "RS256" };
  }
}

function humanTime(epochSeconds) {
  try {
    const ms = Number(epochSeconds) * 1000;
    if (!isFinite(ms)) return "Invalid time";
    const d = new Date(ms);
    return `${d.toUTCString()} (${d.toLocaleString()})`;
  } catch {
    return String(epochSeconds);
  }
}

export default function JwtInspector() {
  const [jwtText, setJwtText] = useState("");
  const [secret, setSecret] = useState("");
  const [pubKeyPem, setPubKeyPem] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [error, setError] = useState(null);

  const parts = useMemo(() => {
    const p = (jwtText || "").trim().split(".");
    return p.length >= 2 ? p : [];
  }, [jwtText]);

  // decoded header/payload
  const decoded = useMemo(() => {
    setError(null);
    if (!parts || parts.length < 2) return null;
    const [h, p, s] = parts;
    const headerStr = base64UrlDecodeToString(h);
    const payloadStr = base64UrlDecodeToString(p);
    let header = null;
    let payload = null;
    try {
      header = headerStr ? JSON.parse(headerStr) : null;
    } catch (e) {
      header = headerStr || null;
    }
    try {
      payload = payloadStr ? JSON.parse(payloadStr) : null;
    } catch (e) {
      payload = payloadStr || null;
    }
    return {
      headerRaw: headerStr,
      payloadRaw: payloadStr,
      header,
      payload,
      signature: s || null,
      signingInput: parts.slice(0, 2).join("."),
    };
  }, [parts]);

  const handleVerify = async () => {
    setVerifyResult(null);
    setError(null);
    if (!decoded) {
      setError("Paste a valid JWT (three parts).");
      return;
    }
    const alg = decoded.header && decoded.header.alg ? decoded.header.alg : null;
    const sig = decoded.signature;
    if (!sig) {
      setError("JWT missing signature part.");
      return;
    }
    const sigU8 = b64UrlToUint8Array(sig);

    try {
      if (alg === "HS256") {
        if (!secret) {
          setError("Provide secret key for HS256 verification.");
          return;
        }
        const res = await verifyHS256(secret, decoded.signingInput, sigU8);
        setVerifyResult(res);
      } else if (alg === "RS256") {
        if (!pubKeyPem) {
          setError("Provide RSA public key PEM for RS256 verification.");
          return;
        }
        const res = await verifyRS256(pubKeyPem, decoded.signingInput, sigU8);
        setVerifyResult(res);
      } else {
        setError(`Signature verification for alg="${alg}" is not supported by this tool. Supported: HS256, RS256.`);
      }
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard");
  };

  const sampleJwtHS = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiQWxpY2UiLCJpYXQiOjE2ODk0NDQwMDAsImV4cCI6Mjk5Mzc5MjAwMH0.m7XvL4u6xKdZyq9P2p2n0C3V7i0K4uK2Y9J2m-3zv3A`;
  // Note: the above is a dummy signature and won't verify.

  const nowSec = Math.floor(Date.now() / 1000);
  const expStatus = useMemo(() => {
    if (!decoded || !decoded.payload) return null;
    const p = decoded.payload;
    const exp = p && (p.exp || p.exp === 0) ? Number(p.exp) : null;
    const nbf = p && (p.nbf || p.nbf === 0) ? Number(p.nbf) : null;
    const iat = p && (p.iat || p.iat === 0) ? Number(p.iat) : null;
    const status = {};
    if (exp) {
      status.exp = {
        raw: exp,
        human: humanTime(exp),
        expired: exp < nowSec,
      };
    }
    if (nbf) {
      status.nbf = {
        raw: nbf,
        human: humanTime(nbf),
        notYetValid: nbf > nowSec,
      };
    }
    if (iat) {
      status.iat = { raw: iat, human: humanTime(iat) };
    }
    return status;
  }, [decoded, nowSec]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔐 JWT Inspector</h1>
      <p className="text-sm text-gray-600 mb-4">
        Paste a JWT below. This tool decodes header & payload, highlights claims, and
        can verify HS256 (secret) or RS256 (public key PEM).
      </p>

      <div className="mb-3">
        <textarea
          value={jwtText}
          onChange={(e) => setJwtText(e.target.value)}
          placeholder="Paste JWT here (header.payload.signature)"
          className="w-full border rounded p-3 font-mono h-28"
        />
      </div>

      <div className="flex gap-3 mb-3">
        <div className="flex-1">
          <label className="block text-sm font-medium">Secret (for HS256)</label>
          <input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="HMAC secret (for HS256)"
            className="w-full border rounded p-2 font-mono"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium">Public Key PEM (for RS256)</label>
          <textarea
            value={pubKeyPem}
            onChange={(e) => setPubKeyPem(e.target.value)}
            placeholder={`-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----`}
            className="w-full border rounded p-2 font-mono h-20"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleVerify}
          className="px-3 py-1 bg-indigo-600 text-white rounded"
        >
          Verify Signature
        </button>
        <button
          onClick={() => {
            if (decoded) handleCopy(prettyJson(decoded.header || decoded.headerRaw));
          }}
          className="px-3 py-1 bg-gray-200 rounded"
          disabled={!decoded}
        >
          Copy Header
        </button>
        <button
          onClick={() => {
            if (decoded) handleCopy(prettyJson(decoded.payload || decoded.payloadRaw));
          }}
          className="px-3 py-1 bg-gray-200 rounded"
          disabled={!decoded}
        >
          Copy Payload
        </button>
        <button
          onClick={() => {
            setJwtText(sampleJwtHS);
            setVerifyResult(null);
            setError(null);
          }}
          className="px-3 py-1 bg-yellow-400 rounded"
        >
          Insert Sample JWT (HS256)
        </button>
      </div>

      {error && <div className="mb-3 text-red-600">{error}</div>}

      {/* Summary */}
      <div className="mb-4 p-4 border rounded bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Algorithm</div>
            <div className="font-mono">{decoded?.header?.alg || "—"}</div>
          </div>
          <div>
            <div className="font-semibold">Signature</div>
            <div className="font-mono break-all">{decoded?.signature || "—"}</div>
          </div>
          <div>
            <div className="font-semibold">Verification</div>
            <div className="font-mono">
              {verifyResult ? (verifyResult.ok ? "✔️ Valid" : `❌ Invalid${verifyResult.error ? ` — ${verifyResult.error}` : ""}`) : "Not checked"}
            </div>
          </div>
        </div>

        {expStatus && (
          <div className="mt-3">
            <div className="font-semibold">Claims</div>
            <div className="mt-1 space-y-1">
              {expStatus.exp && (
                <div>
                  <strong>exp:</strong> {expStatus.exp.human} —{" "}
                  {expStatus.exp.expired ? <span className="text-red-600">Expired</span> : <span className="text-green-600">Valid</span>}
                </div>
              )}
              {expStatus.nbf && (
                <div>
                  <strong>nbf:</strong> {expStatus.nbf.human} —{" "}
                  {expStatus.nbf.notYetValid ? <span className="text-yellow-700">Not yet valid</span> : <span className="text-green-600">OK</span>}
                </div>
              )}
              {expStatus.iat && (
                <div>
                  <strong>iat:</strong> {expStatus.iat.human}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Decoded */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Header</h3>
          <pre className="p-3 border rounded bg-white text-sm font-mono max-h-60 overflow-auto">
            {decoded ? prettyJson(decoded.header || decoded.headerRaw) : "—"}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Payload (Claims)</h3>
          <pre className="p-3 border rounded bg-white text-sm font-mono max-h-60 overflow-auto">
            {decoded ? prettyJson(decoded.payload || decoded.payloadRaw) : "—"}
          </pre>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>
          <strong>Security note:</strong> Don't paste real secrets here in public demos.
        </p>
        <p className="mt-1">
          Supports verification for <code>HS256</code> (provide secret) and <code>RS256</code> (provide public key PEM).
        </p>
      </div>
    </div>
  );
}
