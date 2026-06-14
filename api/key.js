var crypto = require("crypto");

function hashPin(pin) {
  return "pin:" + crypto.createHash("sha256").update(pin).digest("hex");
}

async function redisGet(key) {
  var res = await fetch(process.env.UPSTASH_REDIS_REST_URL + "/get/" + encodeURIComponent(key), {
    headers: { Authorization: "Bearer " + process.env.UPSTASH_REDIS_REST_TOKEN },
  });
  var data = await res.json();
  return data.result;
}

async function redisSet(key, value) {
  await fetch(process.env.UPSTASH_REDIS_REST_URL + "/set/" + encodeURIComponent(key) + "/" + encodeURIComponent(value), {
    headers: { Authorization: "Bearer " + process.env.UPSTASH_REDIS_REST_TOKEN },
  });
}

async function redisDel(key) {
  await fetch(process.env.UPSTASH_REDIS_REST_URL + "/del/" + encodeURIComponent(key), {
    headers: { Authorization: "Bearer " + process.env.UPSTASH_REDIS_REST_TOKEN },
  });
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  try {
    if (req.method === "POST") {
      var pin = (req.body.pin || "").trim();
      var apiKey = (req.body.apiKey || "").trim();
      if (!pin || pin.length < 4) return res.status(400).json({ error: "PIN은 4자 이상이어야 합니다." });
      if (!apiKey) return res.status(400).json({ error: "API 키가 비어 있습니다." });

      await redisSet(hashPin(pin), apiKey);
      return res.json({ ok: true });
    }

    if (req.method === "GET") {
      var pin = (req.query.pin || "").trim();
      if (!pin) return res.status(400).json({ error: "PIN을 입력해주세요." });

      var apiKey = await redisGet(hashPin(pin));
      if (!apiKey) return res.status(404).json({ error: "해당 PIN에 저장된 키가 없습니다." });
      return res.json({ apiKey: apiKey });
    }

    if (req.method === "DELETE") {
      var pin = (req.query.pin || "").trim();
      if (!pin) return res.status(400).json({ error: "PIN을 입력해주세요." });

      await redisDel(hashPin(pin));
      return res.json({ ok: true });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(500).json({ error: "서버 오류: " + e.message });
  }
};
