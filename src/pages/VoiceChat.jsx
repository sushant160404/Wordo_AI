import React, { useState, useEffect, useRef } from 'react';
import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate } from '@langchain/core/prompts';

const VoiceChat = () => {
  // State declarations
  const [language, setLanguage] = useState('french');
  const [isListening, setIsListening] = useState(false);
  const [userText, setUserText] = useState('');
  const [aiFeedback, setAiFeedback] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mode, setMode] = useState('practice');
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);
  const groqRef = useRef(null);

  // Supported languages
  const languages = [
    { 
      id: 'french',
      name: 'French', 
      code: 'fr-FR',
      display: 'Français',
      voices: ['French Female', 'French Male']
    },
    { 
      id: 'spanish',
      name: 'Spanish', 
      code: 'es-ES',
      display: 'Español',
      voices: ['Spanish Female', 'Spanish Male']
    },
    { 
      id: 'hindi',
      name: 'Hindi', 
      code: 'hi-IN',
      display: 'हिन्दी',
      voices: ['Hindi Female', 'Hindi Male']
    },
    { 
      id: 'german',
      name: 'German', 
      code: 'de-DE',
      display: 'Deutsch',
      voices: ['German Female', 'German Male']
    },
    { 
      id: 'english',
      name: 'English', 
      code: 'en-IN',
      display: 'English',
      voices: ['English Female', 'English Male']
    }
  ];

  // Initialize speech recognition and synthesis
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      updateRecognitionLanguage();
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserText(transcript);
        if (mode === 'practice') {
          generateFeedback(transcript);
        } else {
          handleConversation(transcript);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };
    }

    synthesisRef.current = window.speechSynthesis;
    groqRef.current = new ChatGroq({
      apiKey: "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",
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
    });

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthesisRef.current.speaking) {
        synthesisRef.current.cancel();
      }
    };
  }, [language, mode]);

  const updateRecognitionLanguage = () => {
    const lang = languages.find(l => l.id === language);
    if (lang && recognitionRef.current) {
      recognitionRef.current.lang = lang.code;
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speak = (text, langCode) => {
    if (synthesisRef.current.speaking) {
      synthesisRef.current.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    const lang = languages.find(l => l.id === language);
    utterance.lang = langCode || lang?.code || 'en-US';
    
    const voices = synthesisRef.current.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang === utterance.lang && 
      v.name.includes(lang?.name.split(' ')[0])
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    synthesisRef.current.speak(utterance);
  };

  const generateFeedback = async (text) => {
    setIsLoading(true);
    try {
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", `You are a friendly ${language} language tutor. Provide feedback on the following text in English. Focus on grammar, vocabulary, and natural phrasing. If the text is correct, provide alternative ways to say it. explain all of this in english in minimal explaination.`],
        ["human", "{text}"],
      ]);
      
      const chain = prompt.pipe(groqRef.current);
      const response = await chain.invoke({
        text: `Language: ${language}\nStudent's text: "${text}"`,
      });
      
      setAiFeedback(response.content);
      speak(response.content, 'en-US');
    } catch (error) {
      console.error('Error getting feedback:', error);
      setAiFeedback("Sorry, I couldn't process your request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversation = async (userInput) => {
    setIsLoading(true);
    const newEntry = { speaker: 'user', text: userInput };
    setConversation([...conversation, newEntry]);
    
    try {
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", `You are having a conversation in ${language}. Keep responses short and natural (1-2 sentences). Respond in ${language} first, then provide the English translation in parentheses.`],
        ["human", userInput],
      ]);
      
      const chain = prompt.pipe(groqRef.current);
      const response = await chain.invoke({});
      
      const aiEntry = { speaker: 'assistant', text: response.content };
      setConversation(prev => [...prev, aiEntry]);
      speak(response.content.split('(')[0].trim());
    } catch (error) {
      console.error('Error in conversation:', error);
      setConversation(prev => [...prev, { 
        speaker: 'assistant', 
        text: "I'm having trouble responding. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPractice = () => {
    setUserText('');
    setAiFeedback('');
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="relative flex flex-col ml-60 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <p className="text-lg font-medium">Processing your request...</p>
          </div>
        </div>
      )}
      
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white">
          <h1 className="text-2xl font-bold">Language Speaking Assistant</h1>
          <p className="mt-2">Practice speaking in different languages</p>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
              Select Language
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={`py-2 px-4 rounded-lg border transition-all ${language === lang.id 
                    ? 'bg-indigo-600 text-white border-indigo-700' 
                    : 'bg-white text-gray-800 border-gray-300 hover:bg-indigo-50'}`}
                >
                  {lang.display}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Practice Mode
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => setMode('practice')}
                className={`py-2 px-4 rounded-lg border ${mode === 'practice' 
                  ? 'bg-indigo-600 text-white border-indigo-700' 
                  : 'bg-white text-gray-800 border-gray-300 hover:bg-indigo-50'}`}
              >
                Pronunciation Practice
              </button>
              <button
                onClick={() => setMode('conversation')}
                className={`py-2 px-4 rounded-lg border ${mode === 'conversation' 
                  ? 'bg-indigo-600 text-white border-indigo-700' 
                  : 'bg-white text-gray-800 border-gray-300 hover:bg-indigo-50'}`}
              >
                Conversation Practice
              </button>
            </div>
          </div>
          
          {mode === 'practice' ? (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-gray-800 mb-2">
                  Speak in {languages.find(l => l.id === language)?.name}
                </h2>
                <button
                  onClick={toggleListening}
                  disabled={isLoading}
                  className={`flex items-center justify-center py-3 px-6 rounded-full text-white font-medium transition-all ${isListening 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-indigo-500 hover:bg-indigo-600'}`}
                >
                  {isListening ? (
                    <>
                      <span className="w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></span>
                      Listening... Click to Stop
                    </>
                  ) : 'Click to Speak'}
                </button>
              </div>
              
              {userText && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">You said:</h3>
                  <p className="text-gray-800 mb-4">{userText}</p>
                  
                  <h3 className="font-medium text-gray-700 mb-2">Feedback:</h3>
                  <p className="text-gray-800">{aiFeedback}</p>
                  
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => speak(userText)}
                      className="py-2 px-4 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
                      disabled={isSpeaking}
                    >
                      {isSpeaking ? 'Speaking...' : 'Hear Pronunciation'}
                    </button>
                    <button
                      onClick={resetPractice}
                      className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-gray-800 mb-2">Practice Conversation</h2>
                <button
                  onClick={toggleListening}
                  disabled={isLoading}
                  className={`flex items-center justify-center py-3 px-6 rounded-full text-white font-medium transition-all ${isListening 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-indigo-500 hover:bg-indigo-600'}`}
                >
                  {isListening ? (
                    <>
                      <span className="w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></span>
                      Start Conversation
                    </>
                  ) : 'Start Conversation'}
                </button>
              </div>
              
              
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 px-6 py-4 text-center text-sm text-gray-500">
          <p>made by team stack slayers</p>
        </div>
      </div>
    </div>
  );
};

export default VoiceChat;