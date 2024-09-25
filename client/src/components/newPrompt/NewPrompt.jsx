import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import './newPrompt.css';
import Upload from '../upload/Upload';
import { IKImage } from 'imagekitio-react';
import geminiModel from '../../lib/gemini';
import azureOpenAIModel from '../../lib/azureopenai';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useModel } from '../../context/ModelContext';

const NewPrompt = ({ data, setIsTyping, isTyping }) => {
  const { currentModel } = useModel();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const accumulatedTextRef = useRef('');
  const [img, setImg] = useState({
    isLoading: false,
    error: "",
    dbData: {},
    aiData: {},
  });

  const prepareChatHistory = (history, lastUserMessage) => {
    const systemMessage = { role: "system", content: "You are a helpful assistant." };

    const mappedHistory = history.map(({ role, parts }) => ({
      role: role === "model" ? "assistant" : role,
      content: parts[0].text,
    }));

    const userMessage = lastUserMessage ? { role: "user", content: lastUserMessage } : null;

    return [systemMessage, ...mappedHistory, userMessage].filter(Boolean);
  };

  const endRef = useRef(null);
  const formRef = useRef(null);
  const textareaRef = useRef(null);
  const latestMessageRef = useRef(null);

  useEffect(() => {
    if (question !== '') {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [question]);

  // useEffect(() => {
  //   if (answer !== '' && isTyping) {
  //     latestMessageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  //   }
  // }, [answer]);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      return fetch(`${import.meta.env.VITE_API_URL}/api/chats/${data._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.length ? question : undefined,
          answer,
          img: img.dbData?.filePath || undefined,
        }),
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: ['chat', data._id] })
        .then(() => {
          formRef.current.reset();
          setQuestion('');
          setAnswer('');
          setImg({
            isLoading: false,
            error: "",
            dbData: {},
            aiData: {},
          });
          setIsTyping(false);
        });

      textareaRef.current.focus();
    },
    onError: (err) => {
      console.error('Mutation error:', err);
      setIsTyping(false);
    },
  });

  const add = async (text, isInitial) => {
    if (!isInitial) setQuestion(text);
    setIsTyping(true);

    accumulatedTextRef.current = '';

    try {
      if (currentModel === 'gpt-4o') {
        const chatHistory = prepareChatHistory(data?.history || [], text);

        const result = await azureOpenAIModel.chat.completions.create({
          messages: chatHistory,
          stream: true,
        });

        for await (const chunk of result) {
          const chunkText = chunk.choices[0]?.delta?.content || '';
          console.log(chunkText);
          accumulatedTextRef.current += chunkText;
          setAnswer(accumulatedTextRef.current);
        }

        flushSync(() => {
          setAnswer(accumulatedTextRef.current);
        });
        mutation.mutate();

      } else if (currentModel === 'gemini-flash-1.5') {
        const chat = geminiModel.startChat({
          history: data?.history.map(({ role, parts }) => ({
            role,
            parts: [{ text: parts[0].text }],
          })),
          generationConfig: {},
        });

        const result = await chat.sendMessageStream(
          Object.entries(img.aiData).length ? [img.aiData, text] : [text]
        );

        for await (const chunk of result.stream) {
          const chunkText = await chunk.text();
          console.log(chunkText);
          accumulatedTextRef.current += chunkText;
          setAnswer(accumulatedTextRef.current);
        }

        flushSync(() => {
          setAnswer(accumulatedTextRef.current);
        });
        mutation.mutate();

      } else {
        alert(`Unsupported model: ${currentModel}`);
        throw new Error(`Unsupported model: ${currentModel}`);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const text = e.target.text.value;
    if (!text) return;

    add(text, false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  const hasRun = useRef(false);
  useEffect(() => {
    if (!hasRun.current) {
      if (data?.history.length === 1) {
        add(data.history[0].parts[0].text, true);
      }
    }
    hasRun.current = true;
  }, []);

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
          <button className="copy-button" onClick={() => handleCopy(codeString)}>Copy</button>
        </div>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <>
      {img.isLoading && <div className=''>Loading...</div>}
      {img.dbData?.filePath && (
        <IKImage
          urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
          path={img.dbData?.filePath}
          width="380"
          transformation={[{ with: 380 }]}
        />
      )}
      {question && <div className='message user'>
        <div className="user-message">{question}</div>
      </div>}
      <div className='message bot' ref={latestMessageRef}>
        {isTyping && (
          <div className="typing-indicator extended">
            <div className="typing-icon"></div>
            <div className="typing-icon"></div>
            <div className="typing-icon"></div>
            <span className="typing-text">Typing...</span>
          </div>
        )}
        {answer && (
          <ReactMarkdown components={components}>
            {answer}
          </ReactMarkdown>
        )}
      </div>
      <div className="endChat" ref={endRef}></div>
      <form className='newForm' onSubmit={handleSubmit} ref={formRef}>
        <Upload setImg={setImg} />
        <input id='file' type='file' multiple={false} hidden />
        <textarea
          name='text'
          placeholder='Please enter your prompt'
          onKeyDown={handleKeyDown}
          ref={textareaRef}
        />
        <button>
          <img src='/arrow.png' alt='' />
        </button>
      </form>
    </>
  );
};

export default NewPrompt;