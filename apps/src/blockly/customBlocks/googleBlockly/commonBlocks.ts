// We need to use any in this class to generically reference the block type.
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Defines blocks useful in multiple blockly apps
 */

import {
  BlocklyWrapperType,
  JavascriptGeneratorType,
} from '@cdo/apps/blockly/types';
import {readBooleanAttribute} from '../../utils';
import {Block, CodeGenerator} from 'blockly';

const mutatorProperties: string[] = [];

export const blocks = {
  installJoinBlock(blockly: BlocklyWrapperType) {
    // text_join is included with core Blockly. We register a custom text_join_mutator
    // which adds the plus/minus block UI.
    blockly.Blocks.text_join_simple = blockly.Blocks.text_join;
    blockly.JavaScript.forBlock.text_join_simple =
      blockly.JavaScript.forBlock.text_join;
  },
  copyBlockGenerator(
    generator: JavascriptGeneratorType,
    type1: string,
    type2: string
  ) {
    generator.forBlock[type1] = generator.forBlock[type2];
  },
  defineNewBlockGenerator(
    generator: JavascriptGeneratorType,
    type: string,
    generatorFunction: (
      block: Block,
      generator: CodeGenerator
    ) => [string, number] | string | null
  ) {
    generator.forBlock[type] = generatorFunction;
  },
  // For the next 4 functions, this is actually a Block.
  // However we are accessing its properties generically so we type it as a Record.
  mutationToDom(this: Record<string, any>) {
    const container = Blockly.utils.xml.createElement('mutation');
    mutatorProperties.forEach(prop => {
      if (this[prop]) {
        container.setAttribute(prop, this[prop]);
      }
    });
    return container;
  },
  domToMutation(this: Record<string, any>, mutationElement: Element) {
    Array.from(mutationElement.attributes).forEach(attr => {
      const attrName = attr.name;
      const attrValue = attr.value;

      const parsedInt = parseInt(attrValue);
      if (!isNaN(parsedInt)) {
        this[attrName] = parsedInt;
      } else if (
        attrValue.toLowerCase() === 'false' ||
        attrValue.toLowerCase() === 'true'
      ) {
        this[attrName] = readBooleanAttribute(mutationElement, attrName);
      } else {
        this[attrName] = attrValue;
      }
      mutatorProperties.indexOf(attrName) === -1 &&
        mutatorProperties.push(attrName);
    });
  },
  saveExtraState(this: Record<string, any>) {
    const state: Record<string, any> = {};
    mutatorProperties.forEach(prop => {
      if (this[prop]) {
        state[prop] = this[prop];
      }
    });
    return state;
  },
  loadExtraState(this: Record<string, any>, state: Record<string, any>) {
    for (const prop in state) {
      this[prop] = state[prop];
      mutatorProperties.indexOf(prop) === -1 && mutatorProperties.push(prop);
    }
  },
  // Global function to handle serialization hooks
  addSerializationHooksToBlock(block: Block) {
    if (!block.mutationToDom) {
      block.mutationToDom = this.mutationToDom;
    }
    if (!block.domToMutation) {
      block.domToMutation = this.domToMutation;
    }
    if (!block.saveExtraState) {
      block.saveExtraState = this.saveExtraState;
    }
    if (!block.loadExtraState) {
      block.loadExtraState = this.loadExtraState;
    }
  },
  // Copied and modified from core Blockly:
  // https://github.com/google/blockly/blob/1ba0e55e8a61f4228dfcc4d0eb18b7e38666dc6c/generators/javascript/math.ts#L406-L429
  // We need to override this generator in order to continue using the
  // legacy function name from CDO Blockly. Other custom blocks in pools
  // depend on the original name..
  mathRandomIntGenerator(block: Block, generator: JavascriptGeneratorType) {
    // Random integer between [X] and [Y].
    const argument0 =
      generator.valueToCode(block, 'FROM', generator.ORDER_NONE) || '0';
    const argument1 =
      generator.valueToCode(block, 'TO', generator.ORDER_NONE) || '0';
    const functionName = generator.provideFunction_(
      'math_random_int', // Core Blockly uses 'mathRandomInt'
      `
  function ${generator.FUNCTION_NAME_PLACEHOLDER_}(a, b) {
    if (a > b) {
      // Swap a and b to ensure a is smaller.
      var c = a;
      a = b;
      b = c;
    }
    return Math.floor(Math.random() * (b - a + 1) + a);
  }
  `
    );
    const code = `${functionName}(${argument0}, ${argument1})`;
    return [code, generator.ORDER_FUNCTION_CALL];
  },
};
