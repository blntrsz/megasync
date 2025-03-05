export type Article = {
  id: number;
  name: string;
};

export type Comment = {
  id: number;
  name: string;
};

export type DomainObject = {
  id: number;
  domain_object_type: string;
  domain_object_id: number;
  name: string;
};

export type Relationship = {
  id: number;
  previous_domain_object_id: number;
  next_domain_object_id: number;
};
