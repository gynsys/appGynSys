import { useState, useEffect, useCallback } from 'react';
import defaultFlowData from '../data/personal_info_flow.json';

export const usePreconsultaEngine = (flowData = defaultFlowData, config = {}) => {
  const [state, setState] = useState({
    currentNodeId: flowData.start_node,
    history: [],
    answers: {},
    isFinished: false,
  });

  // Inject ID into node object to ensures React keys work (preventing input state persistence)
  const rawNode = flowData.nodes[state.currentNodeId];
  const currentNode = rawNode ? { ...rawNode, id: state.currentNodeId } : null;

  // Helper to update answers
  const saveAnswer = (key, value) => {
    // Prevent Object Injection / Prototype Pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return;
    }

    setState((prev) => {
      // If inside a loop, save to currentData instead of global answers
      if (prev.loopState?.active) {
        return {
          ...prev,
          loopState: {
            ...prev.loopState,
            currentData: { ...prev.loopState.currentData, [key]: value }
          }
        };
      }

      return {
        ...prev,
        answers: { ...prev.answers, [key]: value },
      };
    });
  };

  // Logic to determine the next node
  const getNextNodeId = (node, value) => {
    // 1. Special Skip Logic (Check this FIRST to override default next_node)
    if (node.next_if_contains && Array.isArray(value)) {
      if (value.includes(node.next_if_contains.value)) {
        return node.next_if_contains.next_node;
      }
    }

    // 2. Yes/No Logic
    if (node.type === 'yes_no') {
      // Check if value matches "Yes" (usually boolean true or specific string)
      const isYes = value === true || value === 'Sí' || value === 'Yes';
      if (isYes && node.next_on_yes) return node.next_on_yes;
      if (!isYes && node.next_on_no) return node.next_on_no;
    }

    // 3. Button Logic (options can have next_node)
    if ((node.type === 'buttons' || node.type === 'dropdown' || node.type === 'loop_buttons') && node.options) {
      const selectedOption = node.options.find((opt) => opt.label === value || opt.value === value);
      if (selectedOption && selectedOption.next_node) return selectedOption.next_node;
    }

    // 4. Action Handlers (Mock logic for frontend)
    if (node.type === 'action') {
      return handleActionNode(node);
    }

    // 5. Explicit next_node (Fallback / Default Path)
    if (node.next_node) return node.next_node;

    console.warn(`[Engine] No next node found for ${node.id}`);
    return null;
  };

  // Mock logic for "Action" nodes that usually run on backend
  const handleActionNode = (node, pendingAnswers) => {
    const { handler } = node;
    const answers = { ...state.answers, ...pendingAnswers }; // Merge pending answers

    switch (handler) {
      case 'show_personal_info_summary':
        return node.next_node || null;

      case 'decide_obstetric_flow':
        // Simple logic: if female (assumed) -> check if pregnant or has children? 
        // For now, just go to next_if_needed to show the table
        // NOTE: The nodes related to 'prepare_obstetric_flow' are orphans in the JSON and ignored here.
        return node.next_if_needed || null;

      // case 'prepare_obstetric_flow':
      //   // ORPHAN NODE HANDLER - Ignored in Web Version
      //   if (answers.gyn_has_been_pregnant === 'Sí' || answers.gyn_has_been_pregnant === true) {
      //        return node.next_if_prenatal || null;
      //   }
      //   return node.next_if_gyn || null;

      case 'calculate_imc': {
        const peso = parseFloat(answers.peso_kg || 0);
        const altura = parseFloat(answers.altura_m || 0);
        if (peso > 0 && altura > 0) {
          // Height in meters (input is now in meters)
          const heightM = altura;
          const imc = (peso / (heightM * heightM)).toFixed(2);
          saveAnswer('imc_calculado', imc);
        }
        return node.next_node || null;
      }

      case 'decide_secrecion_subflujo': {
        const secrecion = answers.secrecion_vaginal_tipo || [];

        // Check for "Blanca"
        if (secrecion.includes('Blanca') && !answers.secrecion_blanca_detalle) {
          return node.next_if_blanca;
        }

        // Check for "Sanguinolenta"
        if (secrecion.includes('Sanguinolenta') && !answers.secrecion_sangre_detalle) {
          return node.next_if_sangrado;
        }

        return node.next_if_done;
      }

      case 'combine_examen_fisico_summary': {
        // Just proceed, the summary is built at the end in the page component
        return node.next_node || null;
      }

      case 'check_if_pregnant_for_fertility':
        // If currently pregnant, skip fertility questions
        // We need a way to know if currently pregnant. 
        // For MVP, let's assume we ask fertility intent.
        return node.next_if_ask_fertility || null;

      case 'decide_if_ask_frequency':
        if (answers.gyn_cycles === 'Regulares') return node.next_if_regular || null;
        return node.next_if_irregular || null;



      case 'prepare_birth_details_loop': {
        const ho = answers.ho_table_results || {};
        // Calculate total living children (approximate as Gestas - Abortos)
        const gestas = ho.gestas || 0;
        const abortos = ho.abortos || 0;
        const totalChildren = Math.max(0, gestas - abortos);

        if (totalChildren > 0) {
          // Initialize loop
          setState(prev => ({
            ...prev,
            loopState: {
              active: true,
              variable: node.loop_variable || 'birth_details',
              currentIndex: 0,
              totalIterations: totalChildren,
              currentData: {},
              collectedData: [],
              startNodeId: node.next_node_in_loop,
              endNodeId: node.next_node_after_loop
            }
          }));
          return node.next_node_in_loop || null;
        } else {
          return node.next_node_after_loop || null;
        }
      }

      case 'prepare_generic_loop': {
        // Generic handler for builder templates
        let count = 0;
        if (node.loop_count_variable) {
          const val = answers[node.loop_count_variable];
          count = parseInt(val) || 0;
        } else {
          // Fallback or fixed iteration
          count = node.loop_fixed_count || 1;
        }

        if (count > 0) {
          setState(prev => ({
            ...prev,
            loopState: {
              active: true,
              variable: node.loop_variable || 'generic_loop_data',
              currentIndex: 0,
              totalIterations: count,
              currentData: {},
              collectedData: [],
              startNodeId: node.next_node_in_loop,
              endNodeId: node.next_node_after_loop
            }
          }));
          return node.next_node_in_loop || null;
        } else {
          return node.next_node_after_loop || null;
        }
      }

      case 'loop_step': {
        // Advance loop
        setState(prev => {
          if (!prev.loopState) return prev;

          // Merge pending answers into currentData to ensure we capture the last input
          const updatedCurrentData = { ...prev.loopState.currentData, ...pendingAnswers };

          const newCollected = [...prev.loopState.collectedData, updatedCurrentData];
          const newIndex = prev.loopState.currentIndex + 1;

          if (newIndex < prev.loopState.totalIterations) {
            // Continue loop
            return {
              ...prev,
              loopState: {
                ...prev.loopState,
                currentIndex: newIndex,
                currentData: {},
                collectedData: newCollected
              }
            };
          } else {
            // Finish loop
            return {
              ...prev,
              answers: { ...prev.answers, [prev.loopState.variable]: newCollected },
              loopState: undefined // Clear loop state
            };
          }
        });

        // Determine next node based on loop state (we need to check state AFTER update, but here we predict)
        const loopState = state.loopState;
        if (!loopState) return node.next_node_after_loop || null;

        if (loopState.currentIndex + 1 < loopState.totalIterations) {
          return loopState.startNodeId;
        } else {
          return loopState.endNodeId;
        }
      }

      case 'check_functional_exam_enabled': {
        // Check config from root or pdf_config (handling different backend responses)
        const enabled = config.include_functional_exam ||
          (config.pdf_config && config.pdf_config.include_functional_exam);

        return (enabled === true || enabled === 'true')
          ? node.next_if_enabled
          : node.next_if_disabled;
      }

      case 'calculate_ho_action': {
        const type = answers.obstetric_history_type;
        const ho = answers.ho_table_results || {};

        // Calculate Summary (GPCA)
        const toRoman = (num) => {
          if (!num && num !== 0) return '0';
          const n = parseInt(num);
          if (n === 0) return '0';
          const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
          const syb = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
          let roman_num = '';
          let i = 0;
          let temp = n;
          while (temp > 0) {
            while (temp >= val[i]) {
              roman_num += syb[i];
              temp -= val[i];
            }
            i++;
          }
          return roman_num;
        };

        const parts = [];
        const g = parseInt(ho.gestas) || 0;
        const p = parseInt(ho.partos) || 0;
        const c = parseInt(ho.cesareas) || 0;
        const a = parseInt(ho.abortos) || 0;

        if (g > 0) parts.push(`${toRoman(g)}G`);
        if (p > 0) parts.push(`${toRoman(p)}P`);
        if (c > 0) parts.push(`${toRoman(c)}C`);
        if (a > 0) parts.push(`${toRoman(a)}A`);

        const summary = parts.length > 0 ? parts.join(' ') : (type || 'Nuligesta');
        saveAnswer('obstetric_history_summary', summary);

        // Calculate Loop Iterations (Total Children = Partos + Cesareas)
        const totalChildren = p + c;

        console.log('DEBUG: calculate_ho_action', { ho, totalChildren, type, p, c });

        // Loop Logic Removed: Detail data is collected within the Table component.
        return node.next_node || 'ASK_SEXUALLY_ACTIVE';
      }

      case 'finish_preconsultation':
      case 'generate_summaries': // Handle both standard and mapped end nodes
        setState(prev => ({ ...prev, isFinished: true }));
        return null;

      default:
        // Default fallback for simple pass-through actions
        return node.next_node || null;
    }
  };

  const goToNext = (value) => {
    let pendingAnswers = {};

    // Save answer if applicable
    if (currentNode.save_to && value !== undefined) {
      let finalValue = value;
      // Map Yes/No values if specified
      if (currentNode.type === 'yes_no') {
        if (value === true && currentNode.value_on_yes) finalValue = currentNode.value_on_yes;
        if (value === false && currentNode.value_on_no) finalValue = currentNode.value_on_no;
      }

      // CRITICAL: Force Array to be true array (sometimes checklist returns Obj ?)
      // Actually checklist returns array of strings.

      saveAnswer(currentNode.save_to, finalValue);
      pendingAnswers[currentNode.save_to] = finalValue;
    }

    // Determine next node
    // Pass pendingAnswers to help decision making
    // We update getNextNodeId to handle simple lookups, but actions are handled below.
    let nextId = getNextNodeId(currentNode, value);

    // Explicit Finish Signal from Widget Logic
    if (nextId === 'GENERATE_SUMMARIES' || nextId === 'END_OF_PRECONSULTA') {
      setState(prev => ({ ...prev, isFinished: true }));
      return;
    }
    // Note: getNextNodeId calls handleActionNode if current is action. 
    // We should update getNextNodeId to pass pendingAnswers too.

    // But wait, getNextNodeId signature in my code above doesn't take pendingAnswers.
    // I need to update getNextNodeId signature or call handleActionNode directly if needed.
    // Let's update getNextNodeId signature below.

    // Handle "Action" nodes automatically (skip them in UI)
    // If the next node is an action, we process it immediately recursively
    while (nextId && nextId !== 'END_SUBFLOW' && flowData.nodes[nextId] && flowData.nodes[nextId].type === 'action') {
      const actionNode = flowData.nodes[nextId];

      // Execute action logic (if any side effects needed)
      if (actionNode.handler === 'finish_preconsultation') {
        setState(prev => ({ ...prev, isFinished: true }));
        return;
      }

      // Special handling for loop_step to ensure state update happens
      if (actionNode.handler === 'loop_step') {
        // If loop is finishing:
        const loopState = state.loopState;
        if (loopState && !(loopState.currentIndex + 1 < loopState.totalIterations)) {
          // Loop finishing.
          // Construct the final array to pass to next steps
          const finalCollection = [...loopState.collectedData, loopState.currentData];
          pendingAnswers[loopState.variable] = finalCollection;
        }
      }

      // Get next node from the action
      nextId = handleActionNode(actionNode, pendingAnswers);
    }

    if (nextId === 'END_SUBFLOW') {
      setState(prev => ({ ...prev, isFinished: true }));
      return;
    }

    if (nextId) {
      setState((prev) => ({
        ...prev,
        history: [
          ...prev.history,
          {
            id: prev.currentNodeId,
            node: flowData.nodes[prev.currentNodeId],
            answer: value !== undefined ? value : null // Capture the answer given at this step
          }
        ],
        currentNodeId: nextId,
      }));
    } else if (!state.isFinished) {
      // No next node and not finished? That means we are done!
      setState(prev => ({ ...prev, isFinished: true }));
    }
  };

  const goToPrevious = () => {
    setState((prev) => {
      const newHistory = [...prev.history];
      const prevStep = newHistory.pop();
      if (!prevStep) return prev;
      return {
        ...prev,
        history: newHistory,
        currentNodeId: prevStep.id,
      };
    });
  };

  const rewindTo = (index) => {
    setState((prev) => {
      // If we want to go back to the node at 'index' in history:
      // The new history should be the elements BEFORE 'index'.
      // The new current node is the element AT 'index'.
      const targetStep = prev.history[index];
      const newHistory = prev.history.slice(0, index);

      return {
        ...prev,
        history: newHistory,
        currentNodeId: targetStep.id,
        isFinished: false,
      };
    });
  };

  // Persist answers to localStorage for continuity
  useEffect(() => {
    if (Object.keys(state.answers).length > 0) {
      localStorage.setItem('current_patient_data', JSON.stringify(state.answers));
    }
  }, [state.answers]);

  // Helper to manually set answers (e.g. from confirmation step)
  const setAnswers = (newAnswers) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, ...newAnswers }
    }));
  };

  // Helper to manually jump to a node
  const jumpTo = (nodeId) => {
    setState(prev => ({
      ...prev,
      currentNodeId: nodeId
    }));
  };

  const reset = () => {
    setState({
      currentNodeId: flowData.start_node,
      history: [],
      answers: {},
      isFinished: false,
    });
    // Also clear localStorage if needed, but maybe not? A full reset should imply new patient or restart.
    // For now, let's keep it simple.
  };

  return {
    currentNode,
    currentNodeId: state.currentNodeId,
    answers: state.answers,
    isFinished: state.isFinished,
    history: state.history,
    goToNext,
    goToPrevious,
    rewindTo,
    setAnswers, // Exposed
    jumpTo,     // Exposed
    reset,      // Exposed
    hasPrevious: state.history.length > 0,
    loopState: state.loopState,
  };
};
