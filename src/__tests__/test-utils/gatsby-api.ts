import {
  buildEnumType,
  buildInputObjectType,
  buildInterfaceType,
  buildObjectType,
  buildScalarType,
  buildUnionType,
} from "gatsby/dist/schema/types/type-builders";
import { NodePluginArgs } from "gatsby";

export const gatsbyApiFake: any = {
  schema: {
    buildObjectType,
    buildUnionType,
    buildInterfaceType,
    buildInputObjectType,
    buildEnumType,
    buildScalarType,
  },
};

export const gatsbyApi: NodePluginArgs = gatsbyApiFake;
