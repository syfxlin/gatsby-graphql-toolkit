import {
  GraphQLInterfaceType,
  GraphQLObjectType,
  isInterfaceType,
  isObjectType,
  TypeNameMetaFieldDef,
} from "graphql";
import { GatsbyGraphQLObjectType } from "gatsby";
import { ISchemaCustomizationContext, IGatsbyFieldInfo } from "../types";
import { fieldTransformers } from "./transform-fields/field-transformers";

type FieldMap = NonNullable<GatsbyGraphQLObjectType["config"]["fields"]>;

/**
 * Transforms fields from the remote schema to work in the Gatsby schema
 * with proper node linking and type namespacing
 * also filters out unusable fields and types
 */
export function buildFields(
  context: ISchemaCustomizationContext,
  remoteTypeName: string
): FieldMap {
  const remoteType = context.schema.getType(remoteTypeName);

  if (!isObjectType(remoteType) && !isInterfaceType(remoteType)) {
    throw new Error(
      `Cannot build fields for ${remoteType}. ` +
        `Expecting ${remoteType} to be an object or an interface type`
    );
  }

  const fields = collectGatsbyTypeFields(context, remoteType);
  return fields.reduce((fieldsConfig: FieldMap, field: IGatsbyFieldInfo) => {
    const config = buildFieldConfig(context, field, remoteType);
    if (config) {
      fieldsConfig[field.gatsbyFieldName] = config;
    }
    return fieldsConfig;
  }, Object.create(null));
}

/**
 * Returns a list of fields to be added to Gatsby schema for this type.
 *
 * This list is an intersection of schema fields with fields and aliases from node queries for this type.
 * In other words only fields and aliases requested in node queries will be added to the schema.
 *
 * Also Note: the same field of the remote type may produce multiple fields in Gatsby type
 * (via aliases in the node query)
 */
function collectGatsbyTypeFields(
  context: ISchemaCustomizationContext,
  remoteType: GraphQLObjectType | GraphQLInterfaceType
): IGatsbyFieldInfo[] {
  const {
    sourcingPlan: { fetchedTypeMap },
    typeNameTransform,
  } = context;

  const collectedFields: IGatsbyFieldInfo[] = [];
  const collectFromTypes = isObjectType(remoteType)
    ? [remoteType, ...remoteType.getInterfaces()]
    : [remoteType];

  // Interface includes fields explicitly requested on interface type itself.
  //  It doesn't include any fields selected on it's implementations only.
  //  It is responsibility of the `compileNodeQueries` to include all the
  //  necessary interface fields.

  for (const type of collectFromTypes) {
    const fetchedFields = fetchedTypeMap.get(type.name) ?? [];
    for (const { name, alias } of fetchedFields.values()) {
      collectedFields.push({
        gatsbyFieldName: alias,
        remoteFieldName: name,
        remoteFieldAlias: alias,
        remoteParentType: remoteType.name,
        gatsbyParentType: typeNameTransform.toGatsbyTypeName(remoteType.name),
      });
    }
  }
  return collectedFields;
}

function buildFieldConfig(
  context: ISchemaCustomizationContext,
  fieldInfo: IGatsbyFieldInfo,
  remoteParentType: GraphQLInterfaceType | GraphQLObjectType
): any {
  const remoteField =
    fieldInfo.remoteFieldName === `__typename`
      ? TypeNameMetaFieldDef
      : remoteParentType.getFields()[fieldInfo.remoteFieldName];

  if (!remoteField) {
    throw new Error(
      `Schema customization failed to find remote field ${fieldInfo.remoteParentType}.${fieldInfo.remoteFieldName}`
    );
  }

  const transformArgs = { remoteField, remoteParentType, fieldInfo, context };
  const fieldTransformer = fieldTransformers.find(({ test }) =>
    test(transformArgs)
  );

  if (fieldTransformer) {
    return fieldTransformer.transform(transformArgs);
  }
}
