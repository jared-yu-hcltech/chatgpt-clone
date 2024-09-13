import "./chatPage.css";
import NewPrompt from "../../components/newPrompt/NewPrompt";
import FooterWithDisclaimer from "../../components/footerWithDisclaimer/FooterWithDisclaimer";
import MessageMenu from "../../components/messageMenu/MessageMenu";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { IKImage } from "imagekitio-react";
import { useState } from "react";
import apiService from "../../services/apiServices";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ChatPage = () => {
  const path = useLocation().pathname;
  const chatId = path.split("/").pop();

  const [currentModel, setCurrentModel] = useState('gpt-4o');
  const [copied, setCopied] = useState(false);

  const { isPending, error, data } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_API_URL}/api/chats/${chatId}`, {
        credentials: "include",
      }).then((res) => res.json()),
  });

  console.log(data);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  const handleChangeModel = (newModel) => {
    setCurrentModel(newModel);
    apiService.setModelName(newModel);
    alert(`Switched to model: ${newModel}`);
  };

  const handleGenerateNew = () => {
    // Implement new message generation logic here
    alert('Generate new message functionality not yet implemented');
  };

  const messages = data?.history || [];
  const latestMessageIndex = messages.length - 1;

  // Custom renderer for Markdown
  const components = {
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');
      return !inline && match ? (
        <div className="custom-code-block-wrapper">
          <SyntaxHighlighter
            className='custom-code-block'
            style={atomDark}
            language={match[1]}
            PreTag="div"
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
          <button
            className={`copy-button ${copied ? 'copied' : ''}`}
            onClick={() => handleCopy(codeString)}
          >
            Copy
          </button>
        </div>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <div className="chatPage">
      <div className="wrapper">
        <div className="chat">
          {isPending
            ? "Loading..."
            : error
              ? "Something went wrong!"
              : data?.history?.map((message, i) => (
                <>
                  {message.img && (
                    <IKImage
                      urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
                      path={message.img}
                      height="300"
                      width="400"
                      transformation={[{ height: 300, width: 400 }]}
                      loading="lazy"
                      lqip={{ active: true, quality: 20 }}
                    />
                  )}
                  <div
                    className={`message ${message.role === "user" ? "user" : "bot"}`}
                    key={i}
                  >
                    <ReactMarkdown
                      components={components}
                    >
                      {message.parts[0].text}
                    </ReactMarkdown>
                    {message.role !== "user" && (
                      <MessageMenu
                        currentModel={currentModel}
                        onCopy={() => handleCopy(message.parts[0].text)}
                        onChangeModel={handleChangeModel}
                        onGenerateNew={handleGenerateNew}
                        showAll={i === latestMessageIndex} // Pass prop to control icon visibility
                      />
                    )}
                  </div>
                </>
              ))}
          <div className="newPromptContainer">
            {data && <NewPrompt data={data} />}
            <FooterWithDisclaimer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;