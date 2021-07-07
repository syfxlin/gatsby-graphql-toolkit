import { ISourcingConfig, ISourcingContext } from "../types";
import { defaultGatsbyFieldAliases } from "../config/default-gatsby-field-aliases";
import { createNodeIdTransform } from "../config/node-id-transform";
import { createTypeNameTransform } from "../config/type-name-transform";
import { formatLogMessage } from "../utils/format-log-message";
import { PaginationAdapters } from "../config/pagination-adapters";

export function createSourcingContext(
  config: ISourcingConfig
): ISourcingContext {
  const gatsbyFieldAliases =
    config.gatsbyFieldAliases ?? defaultGatsbyFieldAliases;

  const {
    idTransform = createNodeIdTransform(),
    typeNameTransform = createTypeNameTransform({
      gatsbyTypePrefix: config.gatsbyTypePrefix,
      gatsbyNodeTypeNames: Array.from(config.gatsbyNodeDefs.keys()),
    }),
    paginationAdapters = PaginationAdapters,
  } = config;

  return {
    ...config,
    gatsbyFieldAliases,
    idTransform,
    typeNameTransform,
    paginationAdapters,
    formatLogMessage,
  };
}
