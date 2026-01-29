import { GraphQLClient } from 'graphql-request';

const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:42069/graphql';

export const graphqlClient = new GraphQLClient(GRAPHQL_URL);
