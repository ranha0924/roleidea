var crypto = require("crypto");
var { Redis } = require("@upstash/redis");

var redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

function hashPin(pin) {
  return "pin:" + crypto.createHash("sha256").update(pin).digest("hex");
}

module.exports = async function handler(req, res) {
  if (req.method === "POST") {
    var pin = (req.body.pin || "").trim();
    var apiKey = (req.body.apiKey || "").trim();
    if (!pin || pin.length < 4) return res.status(400).json({ error: "PIN은 4자 이상이어야 합니다." });
    if (!apiKey) return res.status(400).json({ error: "API 키가 비어 있습니다." });

    await redis.set(hashPin(pin), apiKey);
    return res.json({ ok: true });
  }

  if (req.method === "GET") {
    var pin = (req.query.pin || "").trim();
    if (!pin) return res.status(400).json({ error: "PIN을 입력해주세요." });

    var apiKey = await redis.get(hashPin(pin));
    if (!apiKey) return res.status(404).json({ error: "해당 PIN에 저장된 키가 없습니다." });
    return res.json({ apiKey: apiKey });
  }

  if (req.method === "DELETE") {
    var pin = (req.query.pin || "").trim();
    if (!pin) return res.status(400).json({ error: "PIN을 입력해주세요." });

    await redis.del(hashPin(pin));
    return res.json({ ok: true });
  }

  res.status(405).json({ error: "Method not allowed" });
};
