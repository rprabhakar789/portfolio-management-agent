const CONFIG = {
  dispatchType: "portfolio-agent-email",
  githubOwner: "rprabhakar789",
  githubRepo: "portfolio-management-agent",
  githubTokenProperty: "GITHUB_TOKEN",
  labelName: "portfolio-agent",
  processedLabelName: "portfolio-agent-processed",
  targetRepo: "rprabhakar789/devfolio",
};

function pollPortfolioAgentEmails() {
  const label = GmailApp.getUserLabelByName(CONFIG.labelName);
  if (!label) {
    throw new Error(`Missing Gmail label: ${CONFIG.labelName}`);
  }

  const processedLabel =
    GmailApp.getUserLabelByName(CONFIG.processedLabelName) ??
    GmailApp.createLabel(CONFIG.processedLabelName);

  const threads = label.getThreads(0, 20);
  threads.forEach((thread) => {
    const messages = thread.getMessages();
    const latestMessage = messages[messages.length - 1];
    const threadLabels = thread.getLabels().map((entry) => entry.getName());

    if (threadLabels.includes(CONFIG.processedLabelName)) {
      return;
    }

    dispatchToGitHub(thread, latestMessage, threadLabels);
    thread.addLabel(processedLabel);
  });
}

function extractEmailAddress(rawFrom) {
  const matchedAddress = rawFrom.match(/<([^>]+)>/);
  return matchedAddress ? matchedAddress[1] : rawFrom;
}

function dispatchToGitHub(thread, message, labels) {
  const token = PropertiesService.getScriptProperties().getProperty(
    CONFIG.githubTokenProperty,
  );
  if (!token) {
    throw new Error(
      `Missing script property ${CONFIG.githubTokenProperty}. Store a GitHub token there before running.`,
    );
  }

  const payload = {
    event_type: CONFIG.dispatchType,
    client_payload: {
      email: {
        body: message.getPlainBody(),
        from: {
          email: extractEmailAddress(message.getFrom()),
        },
        labels,
        message_id: message.getId(),
        received_at: message.getDate().toISOString(),
        subject: message.getSubject(),
        thread_id: thread.getId(),
      },
      source: "gmail",
      target_repo: CONFIG.targetRepo,
    },
  };

  UrlFetchApp.fetch(
    `https://api.github.com/repos/${CONFIG.githubOwner}/${CONFIG.githubRepo}/dispatches`,
    {
      contentType: "application/json",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      method: "post",
      muteHttpExceptions: false,
      payload: JSON.stringify(payload),
    },
  );
}
