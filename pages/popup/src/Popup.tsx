import '@src/Popup.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { useState } from 'react';
import { FaCaretDown, FaCaretRight } from 'react-icons/fa';
import Header from './lib/Header';
const Popup = () => {
  const goToDashboard = () => chrome.tabs.create({ url: 'https://chatgpt.com/' });
  //const [activeFolderMenu, setActiveFolderMenu] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [activePromptMenu, setActivePromptMenu] = useState<string | null>(null);
  const [selectedPromptContent, setSelectedPromptContent] = useState<string | null>(null);

  const toggleCollapse = (folderId: string) => {
    const newCollapsed = new Set(collapsedFolders);
    if (newCollapsed.has(folderId)) {
      newCollapsed.delete(folderId);
    } else {
      newCollapsed.add(folderId);
    }
    setCollapsedFolders(newCollapsed);
  };
  const folders = [
    {
      id: 'HplOMyf2mDqvVMdphJbt',
      name: 'My Sample Prompts',
      description: 'This is a sample folder',
      prompts: [
        {
          id: '5mJw031VPo2WxNIQyeXN',
          name: 'Demo - Plain text',
          content: 'be a software engineer',
          shortcut: '/do',
        },
        {
          id: '6mJw031VPo2WxNIQyeYN',
          name: 'Demo - Styled Text',
          content:
            '<p>be a translate expert, I will give you a sentence and help me translate to english<span data-type="formtext" class="form-text-field" contenteditable="false" role="button" label="www" defaultvalue="">name: www</span></p><p><span data-type="formtext" class="form-text-field" contenteditable="false" role="button" label="lan" defaultvalue="en">name: lan, default: en</span></p>',
          shortcut: '/ih',
        },
        {
          id: 'prompt-1736573580906',
          name: 'HHHH',
          content:
            '<p>New prompt contentHHHHH, 3扮演前端工程師，專業於<span data-type="formtext" class="form-text-field" contenteditable="false" role="button" label="front" defaultvalue="">name: front</span>，具有語言能力<span data-type="formtext" class="form-text-field" contenteditable="false" role="button" label="lang" defaultvalue="">name: lang</span></p>',
          shortcut: '/pro',
        },
        {
          id: 'prompt-1736574349364',
          name: 'EEE',
          content:
            '<p>MMMYM<span data-type="formtext" class="form-text-field" contenteditable="false" role="button" label="peter" defaultvalue="">name: peter</span></p>',
          shortcut: '/add',
        },
        {
          id: 'prompt-1736657362715',
          name: 'New prompt',
          content: 'New prompt content',
          shortcut: '/dott',
        },
        {
          id: 'prompt-1736658054583',
          name: 'New prompt',
          content: 'New prompt content',
          shortcut: '/er',
        },
      ],
    },
    {
      id: 'folder-1736949636952',
      name: 'New folder',
      description: '',
      prompts: [],
    },
  ];
  const handlePromptClick = (promptId: string, promptContent: string) => {
    setActivePromptMenu(promptId);
    setSelectedPromptContent(promptContent);
  };

  // const handlePromptInsert = (content: string) => {
  //   // Logic to send the content to the active input field in the current tab
  //   chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  //     chrome.tabs.sendMessage(tabs[0].id!, { action: 'insertPrompt', content });
  //   });
  // };

  return (
    <div className="flex h-[500px]">
      {/* Header */}
      <Header goToDashboard={goToDashboard} />
      {/* Content */}
      <div className="flex flex-1 pt-[70px]">
        {/* Sidebar */}
        <aside className="h-full w-1/3 overflow-y-auto bg-white p-2">
          <h2 className="mb-2 text-lg font-semibold">Prompts</h2>
          {/* Add more content here */}
          <ul className="dark:text-gray-200">
            {folders.map(folder => (
              <li key={folder.id} className="mb-2">
                <button
                  className={`flex w-full items-center justify-between rounded px-2 py-1 hover:bg-gray-100 dark:hover:text-black 
                  `}>
                  <strong className="cursor-pointer">{folder.name}</strong>
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleCollapse(folder.id)}
                      className="mr-1 rounded p-1 hover:bg-gray-200 focus:outline-none dark:hover:bg-gray-800">
                      {collapsedFolders.has(folder.id) ? (
                        <FaCaretRight className="text-gray-400" />
                      ) : (
                        <FaCaretDown className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </button>
                {!collapsedFolders.has(folder.id) && (
                  <ul className="ml-4 mt-1">
                    {folder.prompts.length === 0 ? (
                      <span className="ml-2 text-gray-500">No prompts in the folder</span>
                    ) : (
                      folder.prompts.map(prompt => (
                        <li key={prompt.id} className="mb-2">
                          <div
                            className={`flex w-full items-center justify-between rounded px-2 py-1 hover:bg-gray-100 dark:hover:text-black ${
                              activePromptMenu === prompt.id ? 'bg-slate-100 dark:text-black' : ''
                            }`}>
                            <button
                              className="flex flex-1 justify-between"
                              onClick={() => handlePromptClick(prompt.id, prompt.content)}>
                              {prompt.name}
                              <span className="inline-flex h-6 items-center rounded-full border border-blue-300 px-3 py-1 text-sm  font-medium">
                                {prompt.shortcut}
                              </span>
                            </button>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <main className="flex flex-1 flex-col  p-2">
          <h1 className="mb-2 text-xl font-bold">Prompt Content Area</h1>
          <div className="h-full grow rounded-md border bg-white p-2 text-base">
            {/* Add main content here */}
            {selectedPromptContent ? (
              <div dangerouslySetInnerHTML={{ __html: selectedPromptContent }} />
            ) : (
              <p>Select a prompt to view its content</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
