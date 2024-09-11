import "./chatPage.css";
import NewPrompt from "../../components/newPrompt/NewPrompt";
import FooterWithDisclaimer from "../../components/footerWithDisclaimer/FooterWithDisclaimer";
import MessageMenu from "../../components/messageMenu/MessageMenu";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import Markdown from "react-markdown";
import { IKImage } from "imagekitio-react";

const ChatPage = () => {
  const path = useLocation().pathname;
  const chatId = path.split("/").pop();

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
      alert('Message copied to clipboard!');
    });
  };

  const handleChangeModel = () => {
    // Implement model change logic here
    alert('Change model functionality not yet implemented');
  };

  const handleGenerateNew = () => {
    // Implement new message generation logic here
    alert('Generate new message functionality not yet implemented');
  };

  const messages = data?.history || [];
  const latestMessageIndex = messages.length - 1;

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
                    className={
                      message.role === "user" ? "message user" : "message"
                    }
                    key={i}
                  >
                    <Markdown>{message.parts[0].text}</Markdown>
                    {message.role !== "user" && (
                      <MessageMenu
                        onCopy={() => handleCopy(message.parts[0].text)}
                        onChangeModel={handleChangeModel}
                        onGenerateNew={handleGenerateNew}
                        showAll={i === latestMessageIndex} // Pass prop to control icon visibility
                      />
                    )}
                  </div>
                </>
              ))}
          {data && <NewPrompt data={data} />}
          <FooterWithDisclaimer />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;