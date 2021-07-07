import {
  ASTNode,
  BREAK,
  DefinitionNode,
  FieldNode,
  FragmentDefinitionNode,
  FragmentSpreadNode,
  OperationDefinitionNode,
  SelectionNode,
  visit,
} from "graphql";

export function isNode(node: unknown): node is ASTNode {
  return (
    typeof node === `object` &&
    node !== null &&
    typeof node[`kind`] === `string`
  );
}

export function isFragment(node: ASTNode): node is FragmentDefinitionNode {
  return node.kind === "FragmentDefinition";
}

export function isOperation(node: ASTNode): node is OperationDefinitionNode {
  return node.kind === "OperationDefinition";
}

export function isField(node: ASTNode): node is FieldNode {
  return node.kind === "Field";
}

export function isFragmentSpread(node: ASTNode): node is FragmentSpreadNode {
  return node.kind === "FragmentSpread";
}

export function isNonEmptyFragment(
  fragment: DefinitionNode
): fragment is FragmentDefinitionNode {
  if (!isFragment(fragment)) {
    return false;
  }
  let hasFields = false;
  visit(fragment, {
    Field: () => {
      hasFields = true;
      return BREAK;
    },
  });
  return hasFields;
}

export function isTypeNameField(selection: SelectionNode): boolean {
  return (
    selection.kind === "Field" &&
    selection.name.value === `__typename` &&
    !selection.alias
  );
}
