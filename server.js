var express = require("express");
var crypto = require("crypto");
var fs = require("fs");
var path = require("path");

var app = express();
var PORT = process.env.PORT || 3000;
var DATA_DIR = path.join(__dirname, "data");
var KEYS_FILE = path.join(DATA_DIR, "keys.json");

app.use(express.json());
app.use(express.static(__dirname));

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

function readKeys() {
  if (!fs.existsSync(KEYS_FILE)) return {};
  return JSON.parse(fs.readFileSync(KEYS_FILE, "utf8"));
}

function writeKeys(data) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2));
}

function hashPin(pin) {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

// PIN으로 API 키 저장
app.post("/api/key", function (req, res) {
  var pin = (req.body.pin || "").trim();
  var apiKey = (req.body.apiKey || "").trim();
  if (!pin || pin.length < 4) return res.status(400).json({ error: "PIN은 4자 이상이어야 합니다." });
  if (!apiKey) return res.status(400).json({ error: "API 키가 비어 있습니다." });

  var keys = readKeys();
  keys[hashPin(pin)] = apiKey;
  writeKeys(keys);
  res.json({ ok: true });
});

// PIN으로 API 키 불러오기
app.get("/api/key", function (req, res) {
  var pin = (req.query.pin || "").trim();
  if (!pin) return res.status(400).json({ error: "PIN을 입력해주세요." });

  var keys = readKeys();
  var apiKey = keys[hashPin(pin)];
  if (!apiKey) return res.status(404).json({ error: "해당 PIN에 저장된 키가 없습니다." });
  res.json({ apiKey: apiKey });
});

// PIN으로 API 키 삭제
app.delete("/api/key", function (req, res) {
  var pin = (req.query.pin || "").trim();
  if (!pin) return res.status(400).json({ error: "PIN을 입력해주세요." });

  var keys = readKeys();
  delete keys[hashPin(pin)];
  writeKeys(keys);
  res.json({ ok: true });
});

app.listen(PORT, function () {
  console.log("서버 실행: http://localhost:" + PORT);
  console.log("데모 페이지: http://localhost:" + PORT + "/demo/");
});
