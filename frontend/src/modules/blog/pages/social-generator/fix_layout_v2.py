
import os

file_path = "index.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_block = """                             {/* Mobile Action Center */}
                             <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
                               <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-[40px] p-10 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 text-center animate-slideUp">
                                 
                                 <div className="grid grid-cols-1 gap-3 w-full">
                                   <button
                                     onClick={enterMobileFullscreen}
                                     className="w-full py-4 px-6 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3"
                                   >
                                     <FiMaximize2 size={18} />
                                     Editar Diseño
                                   </button>
                                   
                                   <button
                                     onClick={() => setPreviewIndex(0)}
                                     className="w-full py-4 px-6 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-100 dark:border-gray-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-3"
                                   >
                                     <FiEye size={18} />
                                     Vista Previa
                                   </button>
                                 </div>
                               </div>
                               
                               <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                                 <div className="w-8 h-[1px] bg-gray-200"></div>
                                 {generatedContent.slides.length} Diapositivas Listas
                                 <div className="w-8 h-[1px] bg-gray-200"></div>
                               </div>
                             </div>"""

new_block = """                            {/* Mobile Main Content Area */}
                            <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
                              {!generatedContent ? (
                                <div className="h-[400px] w-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-[40px] shadow-sm border-2 border-dashed border-gray-100 dark:border-gray-700 animate-pulse text-center p-10">
                                  <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center text-gray-200 dark:text-gray-700 mb-6">
                                    <FiZap size={40} />
                                  </div>
                                  <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] px-4 leading-relaxed">
                                    Esperando Selección de Artículo
                                  </h3>
                                </div>
                              ) : (
                                <div className="w-full flex flex-col items-center justify-center space-y-4 animate-fadeIn">
                                  {/* Mobile Action Center (C1) */}
                                  <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-[40px] p-10 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 text-center animate-slideUp">
                                    <div className="grid grid-cols-1 gap-3 w-full">
                                      <button
                                        onClick={() => {
                                          enterMobileFullscreen();
                                        }}
                                        className="w-full py-4 px-6 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3"
                                      >
                                        <FiMaximize2 size={18} />
                                        Editar Diseño
                                      </button>
                                      
                                      <button
                                        onClick={() => setPreviewIndex(0)}
                                        className="w-full py-4 px-6 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-100 dark:border-gray-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-3"
                                      >
                                        <FiEye size={18} />
                                        Vista Previa
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                                    <div className="w-8 h-[1px] bg-gray-200"></div>
                                    {generatedContent.slides.length} Diapositivas Listas
                                    <div className="w-8 h-[1px] bg-gray-200"></div>
                                  </div>
                                </div>
                              )}
                            </div>"""

if old_block.strip() in content:
    content = content.replace(old_block.strip(), new_block.strip())
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Done")
else:
    # Try more flexible matching by ignoring exact indentation
    import re
    # Create a simplified version of the old block (no leading spaces)
    old_lines = [line.strip() for line in old_block.strip().split('\n')]
    
    # Try to find a sequence of lines that match
    content_lines = content.split('\n')
    found_start = -1
    for i in range(len(content_lines) - len(old_lines) + 1):
        match = True
        for j in range(len(old_lines)):
            if content_lines[i+j].strip() != old_lines[j]:
                match = False
                break
        if match:
            found_start = i
            break
            
    if found_start != -1:
        # Construct the new content
        new_content_lines = content_lines[:found_start] + [new_block.strip()] + content_lines[found_start + len(old_lines):]
        with open(file_path, "w", encoding="utf-8") as f:
            f.write('\n'.join(new_content_lines))
        print("Done (Flexible)")
    else:
        print("Could not find the block to replace")
