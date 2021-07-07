import { print } from "graphql";
import { inspect } from "util";
import { IRemoteId, IRemoteNode, ISourcingContext } from "../../types";
import {
  findNodeOperationName,
  getGatsbyNodeDefinition,
} from "../utils/node-definition-helpers";
import {
  findNodeFieldPath,
  getFirstValueByPath,
} from "../utils/field-path-utils";
import { addPaginatedFields } from "./fetch-node-fields";

export async function* fetchNonNullishNodesById(
  context: ISourcingContext,
  remoteTypeName: string,
  ids: IRemoteId[]
): AsyncIterable<IRemoteNode> {
  let index = 0;
  for await (const node of fetchNodesById(context, remoteTypeName, ids)) {
    if (!node) {
      throw new Error(
        `Node "${remoteTypeName}" with id "${inspect(ids[index])}" is nullish.`
      );
    }
    index++;
    yield node;
  }
}

export async function* fetchNodesById(
  context: ISourcingContext,
  remoteTypeName: string,
  ids: IRemoteId[]
): AsyncIterable<IRemoteNode | void> {
  const { gatsbyApi, formatLogMessage } = context;
  const { reporter } = gatsbyApi;
  const nodeDefinition = getGatsbyNodeDefinition(context, remoteTypeName);

  const activity = reporter.activityTimer(
    formatLogMessage(`fetching ${nodeDefinition.remoteTypeName}`)
  );
  activity.start();

  try {
    // TODO: we can probably batch things here
    const promises = ids.map((id) =>
      fetchNodeById(context, remoteTypeName, id)
    );
    for await (const node of promises) {
      yield node;
    }
  } finally {
    activity.end();
  }
}

export async function fetchNodeById(
  context: ISourcingContext,
  remoteTypeName: string,
  id: IRemoteId
): Promise<IRemoteNode | void> {
  const nodeDefinition = getGatsbyNodeDefinition(context, remoteTypeName);
  const operationName = findNodeOperationName(nodeDefinition);

  const document = nodeDefinition.document;
  const variables = nodeDefinition.nodeQueryVariables(id);
  const query = print(document);
  const nodeFieldPath = findNodeFieldPath(document, operationName);

  const result = await context.execute({
    query,
    operationName,
    document,
    variables,
  });

  if (!result.data) {
    let message = `Failed to execute query ${operationName}.`;
    if (result.errors?.length) {
      message += ` First error :\n  ${result.errors[0].message}`;
    }
    throw new Error(message);
  }
  const nodeOrArray = getFirstValueByPath(result.data, nodeFieldPath);

  const node =
    Array.isArray(nodeOrArray) && nodeOrArray.length === 1
      ? nodeOrArray[0]
      : nodeOrArray;

  if (typeof node !== `object` || Array.isArray(node) || node === null) {
    return undefined;
  }

  return await addPaginatedFields(context, nodeDefinition, node as IRemoteNode);
}
