/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Variable {
  id: string;
  environment_id: string;
  key: string;
  value: string;
  is_enabled: number;
}

export interface Environment {
  id: string;
  name: string;
  is_active: number;
  created_at: number;
  variables?: Variable[];
}

export interface Collection {
  id: string;
  name: string;
  parent_id?: string | null;
  workspace_id?: string;
  created_at: number;
}

export interface RequestHeader {
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestParam {
  key: string;
  value: string;
  enabled: boolean;
}

export interface AuthConfig {
  token?: string;
  username?: string;
  password?: string;
  key?: string;
  value?: string;
  addTo?: 'headers' | 'params';
}

export interface RequestItem {
  id: string;
  collection_id?: string | null;
  name: string;
  method: string;
  url: string;
  headers: RequestHeader[];
  params: RequestParam[];
  body_type: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'raw text';
  body_content: string;
  auth_type: 'none' | 'bearer' | 'basic' | 'apikey';
  auth_config: AuthConfig;
  created_at: number;
  updated_at: number;
}

export interface HistoryItem {
  id: string;
  method: string;
  url: string;
  status?: number;
  response_time?: number;
  timestamp: number;
}

export interface RequestResponse {
  success: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  duration: number;
  size: number;
  body: string;
}

export interface RequestTab {
  id: string; // matches request.id or a temporary tab id
  name: string;
  request: RequestItem;
  response?: RequestResponse;
  isDirty?: boolean;
  isSending?: boolean;
}

export interface DbConnection {
  id: string;
  name: string;
  type: 'mysql' | 'postgres' | 'mongo' | 'sqlite';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  password_encrypted?: string;
  database?: string;
  options_json?: string;
}

export interface DbQuery {
  id: string;
  connection_id: string;
  query: string;
  name: string;
}

export interface DbHistoryItem {
  id: string;
  connection_id: string;
  query: string;
  timestamp: number;
}

export interface DbTab {
  id: string; // matches tab uuid
  type: 'table' | 'query';
  name: string;
  connectionId: string;
  tableName?: string; // set if type is 'table'
  queryContent?: string; // set if type is 'query'
  results?: {
    rows: any[];
    columns: string[];
  };
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  updated_at: number;
}

export interface CodeSnippetItem {
  id: string;
  title: string;
  language: string;
  code: string;
  description?: string;
  updated_at: number;
}
