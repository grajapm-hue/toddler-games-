// v1.41 supersedes transparent caption panels with fitted yellow text tabs.
// Retain this entrypoint for existing local validation commands.
if(!process.env.TEXT_EVIDENCE&&process.env.LABEL_EVIDENCE)process.env.TEXT_EVIDENCE=process.env.LABEL_EVIDENCE;
require('./check-crisp-text.cjs');