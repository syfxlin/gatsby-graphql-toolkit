import {
  ASTKindToNode,
  SelectionNode,
  SelectionSetNode,
  Visitor,
} from "graphql";

/**
 * Strip unnecessary wrapping (just a prettify)
 * i.e. { ...on InterfaceType { ...on ObjectType1 ...on ObjectType2 } }
 *   -> { ...on ObjectType1 ...on ObjectType2 }
 */
export function stripWrappingFragments(): Visitor<ASTKindToNode> {
  return {
    SelectionSet: {
      leave: (node: SelectionSetNode) => {
        // if (
        //   node.selections.length !== 1 ||
        //   node.selections[0].kind !== "InlineFragment"
        // ) {
        //   return
        // }
        // const inlineFragment = node.selections[0]
        // const isWrapper = inlineFragment.selectionSet.selections.every(
        //   selection =>
        //     selection.kind === "FragmentSpread" ||
        //     selection.kind === "InlineFragment"
        // )
        // return isWrapper ? inlineFragment.selectionSet : undefined
        const fields: SelectionNode[] = [];
        for (const selection of node.selections) {
          if (selection.kind === "InlineFragment") {
            fields.push(...selection.selectionSet.selections);
          } else {
            fields.push(selection);
          }
        }
        return {
          kind: "SelectionSet",
          selections: fields,
        };
      },
    },
  };
}
