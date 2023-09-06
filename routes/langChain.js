const router = require("express").Router();
const express = require("express");
const app = express();
const { asyncErrorHandler } = require("./utils");
const prisma = require("../prisma/prisma");
const { OpenAI } = require("langchain/llms/openai");
const { PromptTemplate } = require("langchain/prompts");
const { LLMChain } = require("langchain/chains");

app.use(express.json());

OPEN_AI_KEY = process.env.OPENAI_API_KEY;

const model = new OpenAI({ temperature: 0.9 });
const template = "Return flashcard set... {studyGuide}?";
const prompt = new PromptTemplate({
  template: template,
  inputVariables: ["studyGuide"],
});

const model1 = new OpenAI({ temperature: 0.9 });
const template1 = "Return test prediction... {studyGuide}?";
const prompt1 = new PromptTemplate({
  template: template1,
  inputVariables: ["studyGuide"],
});

const chain = new LLMChain({ llm: model, prompt: prompt });
const chain1 = new LLMChain({ llm: model1, prompt: prompt1 });

const generateResponse = async (text) => {
  const res = await chain.call({ studyGuide: text });
  console.log(res);
  return res;
};

const generateResponse1 = async (text) => {
  const res = await chain1.call({ studyGuide: text });
  console.log(res);
  return res;
};

router.post("/flashcard", async (req, res) => {
  const { studyGuide } = req.body;
  // const response = generateResponse(studyGuide);
  res.send("i pooped my pants");
});

router.post("/prediction", async (req, res) => {
  const { studyGuide } = req.body;
  // const response = generateResponse1(studyGuide);
  res.send("i pooped my pants");
});

router.post("/both", async (req, res) => {
  const { studyGuide } = req.body;
  // const response = generateResponse(studyGuide)
  // const response2 = generateResponse1(studyGuide);

  res.send("i pooped my pants");
});

module.exports = router;
