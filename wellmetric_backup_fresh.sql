--
-- PostgreSQL database dump
--

\restrict L1mHM8hrWxujKOA7FbZJ5IDc29VSg4wsd6p5axeiBPFZ7rFdJa6SOBrwhZsNnnq

-- Dumped from database version 14.19 (Homebrew)
-- Dumped by pg_dump version 14.19 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: demo_requests_company_size_enum; Type: TYPE; Schema: public; Owner: wellanalytics
--

CREATE TYPE public.demo_requests_company_size_enum AS ENUM (
    '1-50',
    '51-250',
    '251-1000',
    '1000+'
);


ALTER TYPE public.demo_requests_company_size_enum OWNER TO wellanalytics;

--
-- Name: demo_requests_status_enum; Type: TYPE; Schema: public; Owner: wellanalytics
--

CREATE TYPE public.demo_requests_status_enum AS ENUM (
    'pending',
    'contacted',
    'demo_done',
    'converted',
    'rejected'
);


ALTER TYPE public.demo_requests_status_enum OWNER TO wellanalytics;

--
-- Name: distribution_campaigns_status_enum; Type: TYPE; Schema: public; Owner: wellanalytics
--

CREATE TYPE public.distribution_campaigns_status_enum AS ENUM (
    'pending',
    'scheduled',
    'sending',
    'sent',
    'cancelled'
);


ALTER TYPE public.distribution_campaigns_status_enum OWNER TO wellanalytics;

--
-- Name: distribution_campaigns_trigger_type_enum; Type: TYPE; Schema: public; Owner: wellanalytics
--

CREATE TYPE public.distribution_campaigns_trigger_type_enum AS ENUM (
    'cron_auto',
    'hr_manual',
    'hr_reminder'
);


ALTER TYPE public.distribution_campaigns_trigger_type_enum OWNER TO wellanalytics;

--
-- Name: distribution_logs_status_enum; Type: TYPE; Schema: public; Owner: wellanalytics
--

CREATE TYPE public.distribution_logs_status_enum AS ENUM (
    'pending',
    'sent',
    'delivered',
    'bounced',
    'failed'
);


ALTER TYPE public.distribution_logs_status_enum OWNER TO wellanalytics;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: actions; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    department_id uuid,
    dimension character varying(30),
    title character varying(300) NOT NULL,
    description text,
    content_item_id uuid,
    status character varying(20) DEFAULT 'planned'::character varying NOT NULL,
    due_date date,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.actions OWNER TO wellanalytics;

--
-- Name: ai_insights; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.ai_insights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    department_id uuid,
    survey_id uuid,
    period character varying(7),
    insight_type character varying(30) NOT NULL,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_insights OWNER TO wellanalytics;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    company_id uuid,
    action character varying(100) NOT NULL,
    target_type character varying(50),
    target_id uuid,
    payload jsonb,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO wellanalytics;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    slug character varying(100) NOT NULL,
    industry character varying(100),
    size_band character varying(20),
    plan character varying(20) DEFAULT 'starter'::character varying NOT NULL,
    plan_expires_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    contact_email character varying(200),
    logo_url text,
    settings jsonb DEFAULT '{"default_language": "tr", "benchmark_visible": true, "employee_accounts": false, "anonymity_threshold": 5}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    consultant_id uuid
);


ALTER TABLE public.companies OWNER TO wellanalytics;

--
-- Name: consultant_plans; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.consultant_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    consultant_id uuid NOT NULL,
    plan character varying(20) DEFAULT 'starter'::character varying NOT NULL,
    max_companies integer DEFAULT 5 NOT NULL,
    max_employees integer DEFAULT 100 NOT NULL,
    ai_enabled boolean DEFAULT true NOT NULL,
    white_label boolean DEFAULT false NOT NULL,
    custom_domain character varying(200),
    valid_until timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    brand_name character varying(200),
    brand_logo_url character varying,
    brand_color character varying(7),
    brand_favicon_url character varying,
    custom_domain_verified boolean DEFAULT false NOT NULL
);


ALTER TABLE public.consultant_plans OWNER TO wellanalytics;

--
-- Name: content_items; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.content_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title_tr character varying(300) NOT NULL,
    title_en character varying(300),
    description_tr text,
    description_en text,
    type character varying(30) NOT NULL,
    dimension character varying(30),
    url_tr text,
    url_en text,
    score_threshold integer,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    consultant_id uuid
);


ALTER TABLE public.content_items OWNER TO wellanalytics;

--
-- Name: credit_balances; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.credit_balances (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    consultant_id uuid NOT NULL,
    credit_type_key character varying(50) NOT NULL,
    balance integer DEFAULT 0 NOT NULL,
    used_this_month integer DEFAULT 0 NOT NULL,
    last_reset_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.credit_balances OWNER TO wellanalytics;

--
-- Name: credit_transactions; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.credit_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    consultant_id uuid NOT NULL,
    credit_type_key character varying(50) NOT NULL,
    amount integer NOT NULL,
    type character varying(20) NOT NULL,
    description text,
    company_id uuid,
    reference_id character varying(100),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.credit_transactions OWNER TO wellanalytics;

--
-- Name: credit_types; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.credit_types (
    key character varying(50) NOT NULL,
    label_tr character varying(100) NOT NULL,
    label_en character varying(100) NOT NULL,
    description_tr text,
    description_en text,
    icon character varying(50) DEFAULT 'Brain'::character varying NOT NULL,
    color character varying(20) DEFAULT '#6C3A8E'::character varying NOT NULL,
    sort_order integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.credit_types OWNER TO wellanalytics;

--
-- Name: demo_requests; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.demo_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(200) NOT NULL,
    email character varying(200) NOT NULL,
    company_name character varying(200) NOT NULL,
    company_size character varying(20),
    industry character varying(100),
    phone character varying(50),
    message text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    assigned_to uuid
);


ALTER TABLE public.demo_requests OWNER TO wellanalytics;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.departments OWNER TO wellanalytics;

--
-- Name: distribution_campaigns; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.distribution_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    survey_id uuid NOT NULL,
    total_recipients integer DEFAULT 0 NOT NULL,
    sent_count integer DEFAULT 0 NOT NULL,
    delivered_count integer DEFAULT 0 NOT NULL,
    opened_count integer DEFAULT 0 NOT NULL,
    clicked_count integer DEFAULT 0 NOT NULL,
    completed_count integer DEFAULT 0 NOT NULL,
    assignment_id character varying,
    period character varying,
    created_by character varying NOT NULL,
    trigger_type public.distribution_campaigns_trigger_type_enum DEFAULT 'hr_manual'::public.distribution_campaigns_trigger_type_enum NOT NULL,
    scheduled_at timestamp without time zone,
    sent_at timestamp without time zone,
    status public.distribution_campaigns_status_enum DEFAULT 'pending'::public.distribution_campaigns_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.distribution_campaigns OWNER TO wellanalytics;

--
-- Name: distribution_logs; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.distribution_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid NOT NULL,
    company_id character varying NOT NULL,
    full_name character varying,
    user_id character varying,
    mail_provider_id character varying,
    bounce_reason character varying,
    retry_count integer DEFAULT 0 NOT NULL,
    email character varying NOT NULL,
    survey_token_id character varying,
    status public.distribution_logs_status_enum DEFAULT 'pending'::public.distribution_logs_status_enum NOT NULL,
    sent_at timestamp without time zone,
    opened_at timestamp without time zone,
    clicked_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.distribution_logs OWNER TO wellanalytics;

--
-- Name: draft_responses; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.draft_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    survey_id uuid NOT NULL,
    user_id uuid,
    token character varying(100),
    answers jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.draft_responses OWNER TO wellanalytics;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.employees (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    department_id uuid,
    full_name character varying NOT NULL,
    email character varying NOT NULL,
    "position" character varying,
    start_date date,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deactivated_at timestamp with time zone
);


ALTER TABLE public.employees OWNER TO wellanalytics;

--
-- Name: industries; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.industries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(100) NOT NULL,
    label_tr character varying(200) NOT NULL,
    label_en character varying(200),
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.industries OWNER TO wellanalytics;

--
-- Name: industry_benchmark_scores; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.industry_benchmark_scores (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    industry character varying NOT NULL,
    region character varying NOT NULL,
    dimension character varying NOT NULL,
    score numeric(5,2) NOT NULL,
    source character varying,
    source_year integer,
    is_seed boolean DEFAULT true NOT NULL,
    updated_by character varying,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.industry_benchmark_scores OWNER TO wellanalytics;

--
-- Name: invitations; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    company_id uuid,
    token character varying(128) NOT NULL,
    type character varying(30) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.invitations OWNER TO wellanalytics;

--
-- Name: mail_templates; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.mail_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(50) NOT NULL,
    subject_tr character varying(300) NOT NULL,
    subject_en character varying(300),
    body_tr text NOT NULL,
    body_en text,
    variables jsonb DEFAULT '[]'::jsonb NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


ALTER TABLE public.mail_templates OWNER TO wellanalytics;

--
-- Name: onboarding_assignments; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.onboarding_assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid NOT NULL,
    survey_token_id uuid,
    wave_number integer NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    sent_at timestamp with time zone,
    completed_at timestamp with time zone,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.onboarding_assignments OWNER TO wellanalytics;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    consultant_id uuid NOT NULL,
    subscription_id uuid,
    amount numeric(10,2) NOT NULL,
    currency character varying(10) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    provider character varying(50) NOT NULL,
    provider_payment_id character varying(255),
    invoice_url text,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    package_key character varying(50)
);


ALTER TABLE public.payments OWNER TO wellanalytics;

--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.platform_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ai_provider_default character varying(30) DEFAULT 'anthropic'::character varying NOT NULL,
    ai_model_default character varying(100) DEFAULT 'claude-opus-4-5'::character varying NOT NULL,
    ai_task_models jsonb DEFAULT '{}'::jsonb NOT NULL,
    ai_max_tokens integer DEFAULT 2000 NOT NULL,
    ai_temperature numeric(2,1) DEFAULT 0.3 NOT NULL,
    ai_enabled boolean DEFAULT true NOT NULL,
    mail_provider character varying(30) DEFAULT 'resend'::character varying NOT NULL,
    mail_from_address character varying(200),
    mail_from_name character varying(200),
    storage_provider character varying(20) DEFAULT 'cloudflare_r2'::character varying NOT NULL,
    platform_name character varying(200) DEFAULT 'Wellbeing Platformu'::character varying NOT NULL,
    platform_url character varying(200),
    supported_languages jsonb DEFAULT '["tr", "en"]'::jsonb NOT NULL,
    default_language character varying(10) DEFAULT 'tr'::character varying NOT NULL,
    anonymity_threshold integer DEFAULT 5 NOT NULL,
    score_alert_threshold integer DEFAULT 45 NOT NULL,
    api_keys jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    mail_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    storage_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    admin_email character varying(200),
    consultant_packages jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.platform_settings OWNER TO wellanalytics;

--
-- Name: product_packages; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.product_packages (
    key character varying(100) NOT NULL,
    type character varying(20) NOT NULL,
    label_tr character varying(200) NOT NULL,
    label_en character varying(200) NOT NULL,
    description_tr text,
    description_en text,
    price_monthly numeric(10,2),
    price_yearly numeric(10,2),
    currency character varying(10) DEFAULT 'TRY'::character varying NOT NULL,
    credits jsonb DEFAULT '{}'::jsonb NOT NULL,
    max_companies integer,
    max_employees integer,
    ai_enabled boolean DEFAULT false NOT NULL,
    white_label boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_visible boolean DEFAULT true NOT NULL
);


ALTER TABLE public.product_packages OWNER TO wellanalytics;

--
-- Name: response_answer_selections; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.response_answer_selections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    response_id uuid NOT NULL,
    question_id uuid NOT NULL,
    option_id uuid NOT NULL,
    rank_order integer
);


ALTER TABLE public.response_answer_selections OWNER TO wellanalytics;

--
-- Name: response_answers; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.response_answers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    response_id uuid NOT NULL,
    question_id uuid NOT NULL,
    answer_value integer,
    answer_text text,
    score numeric(5,2),
    answer_row_id uuid,
    answer_option_id uuid,
    dimension character varying(50),
    answer_number numeric(10,2)
);


ALTER TABLE public.response_answers OWNER TO wellanalytics;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    consultant_id uuid NOT NULL,
    package_key character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "interval" character varying(20) NOT NULL,
    current_period_start timestamp without time zone NOT NULL,
    current_period_end timestamp without time zone NOT NULL,
    cancel_at_period_end boolean DEFAULT false NOT NULL,
    provider character varying(50),
    provider_subscription_id character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subscriptions OWNER TO wellanalytics;

--
-- Name: survey_assignments; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.survey_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    survey_id uuid NOT NULL,
    company_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    due_at timestamp with time zone,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    assigned_by uuid,
    period character varying(50),
    department_id uuid
);


ALTER TABLE public.survey_assignments OWNER TO wellanalytics;

--
-- Name: survey_drafts; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.survey_drafts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_by uuid NOT NULL,
    title character varying(300),
    draft_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    last_saved_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.survey_drafts OWNER TO wellanalytics;

--
-- Name: survey_question_options; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.survey_question_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_id uuid NOT NULL,
    order_index integer NOT NULL,
    label_tr character varying(300) NOT NULL,
    label_en character varying(300),
    value numeric(5,2) NOT NULL
);


ALTER TABLE public.survey_question_options OWNER TO wellanalytics;

--
-- Name: survey_question_rows; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.survey_question_rows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_id uuid NOT NULL,
    order_index integer NOT NULL,
    is_reversed boolean DEFAULT false NOT NULL,
    weight numeric(5,2) DEFAULT '1'::numeric NOT NULL,
    label_tr character varying(300) NOT NULL,
    label_en character varying(300),
    dimension character varying(50)
);


ALTER TABLE public.survey_question_rows OWNER TO wellanalytics;

--
-- Name: survey_questions; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.survey_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    survey_id uuid NOT NULL,
    question_text_tr text NOT NULL,
    question_text_en text,
    is_reversed boolean DEFAULT false NOT NULL,
    weight numeric(5,2) DEFAULT '1'::numeric NOT NULL,
    order_index integer NOT NULL,
    is_required boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    number_min integer,
    number_max integer,
    number_step integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    dimension character varying(50) NOT NULL,
    question_type character varying(50) NOT NULL,
    matrix_label_tr character varying(100),
    matrix_label_en character varying(100)
);


ALTER TABLE public.survey_questions OWNER TO wellanalytics;

--
-- Name: survey_responses; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.survey_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    survey_id uuid NOT NULL,
    assignment_id uuid,
    user_id uuid,
    company_id uuid NOT NULL,
    department_id uuid,
    tenure_months integer,
    is_anonymous boolean DEFAULT true NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    period character varying(7) NOT NULL,
    location character varying(100),
    seniority character varying(20),
    age_group character varying(20),
    gender character varying(20)
);


ALTER TABLE public.survey_responses OWNER TO wellanalytics;

--
-- Name: survey_throttle; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.survey_throttle (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    survey_id uuid NOT NULL,
    last_submitted_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.survey_throttle OWNER TO wellanalytics;

--
-- Name: survey_tokens; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.survey_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    survey_id uuid NOT NULL,
    assignment_id uuid,
    company_id uuid NOT NULL,
    department_id uuid,
    is_used boolean DEFAULT false NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    due_at timestamp with time zone,
    metadata jsonb,
    token character varying(100) NOT NULL,
    email character varying,
    full_name character varying,
    language character varying DEFAULT 'tr'::character varying NOT NULL,
    employee_id uuid,
    pin_code character varying(6)
);


ALTER TABLE public.survey_tokens OWNER TO wellanalytics;

--
-- Name: surveys; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.surveys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    title_tr character varying(300) NOT NULL,
    title_en character varying(300),
    description_tr text,
    description_en text,
    is_anonymous boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    throttle_days integer DEFAULT 7 NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    type character varying(50) NOT NULL,
    frequency character varying(50),
    is_pool_visible boolean DEFAULT true NOT NULL,
    pool_added_at timestamp with time zone
);


ALTER TABLE public.surveys OWNER TO wellanalytics;

--
-- Name: typeorm_migrations; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.typeorm_migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.typeorm_migrations OWNER TO wellanalytics;

--
-- Name: typeorm_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: wellanalytics
--

CREATE SEQUENCE public.typeorm_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.typeorm_migrations_id_seq OWNER TO wellanalytics;

--
-- Name: typeorm_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wellanalytics
--

ALTER SEQUENCE public.typeorm_migrations_id_seq OWNED BY public.typeorm_migrations.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    department_id uuid,
    email character varying(200) NOT NULL,
    password_hash text,
    full_name character varying(200),
    role character varying(20) NOT NULL,
    "position" character varying(100),
    location character varying(100),
    seniority character varying(20),
    age_group character varying(20),
    gender character varying(20),
    start_date date,
    language character varying(10) DEFAULT 'tr'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO wellanalytics;

--
-- Name: wellbeing_scores; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.wellbeing_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    score numeric(5,2) NOT NULL,
    calculated_at timestamp with time zone DEFAULT now() NOT NULL,
    response_count integer DEFAULT 0 NOT NULL,
    period character varying(50) NOT NULL,
    segment_type character varying(50),
    segment_value character varying(100),
    dimension character varying(50) NOT NULL
);


ALTER TABLE public.wellbeing_scores OWNER TO wellanalytics;

--
-- Name: typeorm_migrations id; Type: DEFAULT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.typeorm_migrations ALTER COLUMN id SET DEFAULT nextval('public.typeorm_migrations_id_seq'::regclass);


--
-- Data for Name: actions; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.actions (id, company_id, department_id, dimension, title, description, content_item_id, status, due_date, created_by, created_at, updated_at) FROM stdin;
8eb5bfec-9065-4206-bcb9-ce8f2bb55970	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	\N	mental	Mindfulness Seansları	Tüm çalışanlar için haftalık 15 dakikalık nefes egzersizi.	\N	in_progress	2026-05-11	\N	2026-05-04 00:35:21.996237+03	2026-05-04 00:37:39.833+03
38f009df-d94a-44cc-953d-887da76eb0ba	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	\N	physical	Ergonomi Kontrol Listesi	Evden çalışanlar için sağlıklı çalışma alanı rehberi.	\N	completed	2026-05-07	\N	2026-05-04 00:35:21.996237+03	2026-05-04 00:38:31.718+03
\.


--
-- Data for Name: ai_insights; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.ai_insights (id, company_id, department_id, survey_id, period, insight_type, content, metadata, generated_at) FROM stdin;
b7654191-09e2-4498-8614-5f6cffcc9ab2	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	\N	\N	\N	trend_analysis	Bu ayki verilerimize göre Zihinsel Esenlik skorunda %15lik bir iyileşme gözlemlenirken, Sosyal Esenlik boyutunda düşüş yaşanmış. Ekip aktivitelerini artırmak sosyal bağları güçlendirebilir.	{}	2026-05-04 00:35:12.731187+03
dbe799ec-e1ac-4f93-995f-39402bf4a3eb	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	\N	\N	\N	intelligence_report	Nisan 2026 Wellbeing Raporu Hazır.	{"language": "tr", "pdf_s3_key": "demo_report.pdf"}	2026-04-04 00:35:26.753221+03
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.audit_logs (id, user_id, company_id, action, target_type, target_id, payload, ip_address, created_at) FROM stdin;
90c13110-758c-4712-8985-f59b7755c254	40245aa3-35ab-45b1-a8c1-bf119e9c032c	\N	settings.update	platform_settings	\N	\N	\N	2026-04-28 13:46:00.337499+03
95db3435-375a-4072-ae56-6103e7ef5da9	40245aa3-35ab-45b1-a8c1-bf119e9c032c	\N	settings.update	platform_settings	\N	\N	\N	2026-04-28 13:46:42.575045+03
758eb8db-f3f2-453b-91a5-7bdd06fcbd29	40245aa3-35ab-45b1-a8c1-bf119e9c032c	\N	settings.update	platform_settings	\N	\N	\N	2026-04-28 13:47:30.324328+03
39fa1f9a-37ee-4aeb-bea1-2d14bf7a32b7	40245aa3-35ab-45b1-a8c1-bf119e9c032c	\N	settings.update	platform_settings	\N	\N	\N	2026-04-28 13:50:15.647592+03
62286ec8-7592-4e17-8261-29ce11d76365	40245aa3-35ab-45b1-a8c1-bf119e9c032c	\N	industry.update	industry	cccecd23-d693-462e-b357-3ccfbb32f287	{"order_index": 2}	\N	2026-04-28 15:02:20.890229+03
4dfb5a92-c6fc-4651-9898-d4d06e43aecc	40245aa3-35ab-45b1-a8c1-bf119e9c032c	3042d3cb-36c8-4ad2-86f8-9efd88b9ee91	company.create	company	3042d3cb-36c8-4ad2-86f8-9efd88b9ee91	{"name": "Onur Tech", "plan": "growth"}	\N	2026-04-28 15:07:33.071006+03
ba070c4b-7bee-4cf4-9f87-7d293364f737	40245aa3-35ab-45b1-a8c1-bf119e9c032c	3042d3cb-36c8-4ad2-86f8-9efd88b9ee91	company.update	company	3042d3cb-36c8-4ad2-86f8-9efd88b9ee91	{"name": "Onur Tech", "plan": "growth", "industry": "finance", "size_band": "1-50", "contact_email": "onur@3bitz.com", "default_language": "tr"}	\N	2026-04-28 15:18:24.51562+03
c5951881-4004-40ca-9346-361e138ee05e	40245aa3-35ab-45b1-a8c1-bf119e9c032c	93246ec3-1054-4cad-9327-9607a349325a	company.create	company	93246ec3-1054-4cad-9327-9607a349325a	{"name": "oe2", "plan": "starter"}	\N	2026-04-28 15:19:04.157126+03
43768eba-adda-4e1b-9ae6-8d0b39d945f6	40245aa3-35ab-45b1-a8c1-bf119e9c032c	ddf218eb-6151-4d8f-b07e-af714858ca7a	company.create	company	ddf218eb-6151-4d8f-b07e-af714858ca7a	{"name": "Audit Test Company", "plan": "starter"}	\N	2026-04-28 17:17:10.226539+03
0a67b2e7-3982-4405-a176-ea6c39344a3d	40245aa3-35ab-45b1-a8c1-bf119e9c032c	ddf218eb-6151-4d8f-b07e-af714858ca7a	user.delete	user	7717c5ec-f736-4b0f-a934-dd2b84fbf74e	\N	\N	2026-04-30 15:28:58.546604+03
8e29330f-1898-47f7-aff9-6e32d271e4ee	40245aa3-35ab-45b1-a8c1-bf119e9c032c	ddf218eb-6151-4d8f-b07e-af714858ca7a	user.status_toggle	user	7717c5ec-f736-4b0f-a934-dd2b84fbf74e	{"is_active": true}	\N	2026-04-30 15:32:21.127564+03
a6d05793-9cb4-4217-9f16-82847cd6f5b5	40245aa3-35ab-45b1-a8c1-bf119e9c032c	ddf218eb-6151-4d8f-b07e-af714858ca7a	user.status_toggle	user	7717c5ec-f736-4b0f-a934-dd2b84fbf74e	{"is_active": false}	\N	2026-04-30 15:32:22.344212+03
96b398cf-6b1b-42c8-9388-eef122877740	40245aa3-35ab-45b1-a8c1-bf119e9c032c	ddf218eb-6151-4d8f-b07e-af714858ca7a	user.hard_delete	user	7717c5ec-f736-4b0f-a934-dd2b84fbf74e	\N	\N	2026-04-30 15:32:24.999009+03
15ac98d4-958c-473d-ac4a-dc90bfd18403	40245aa3-35ab-45b1-a8c1-bf119e9c032c	ddf218eb-6151-4d8f-b07e-af714858ca7a	company.delete	company	ddf218eb-6151-4d8f-b07e-af714858ca7a	\N	\N	2026-04-30 15:32:30.447503+03
f5752235-58c7-4b21-990e-2c1057a3e2ec	40245aa3-35ab-45b1-a8c1-bf119e9c032c	ddf218eb-6151-4d8f-b07e-af714858ca7a	company.delete	company	ddf218eb-6151-4d8f-b07e-af714858ca7a	\N	\N	2026-04-30 15:32:37.724357+03
f6eed9ec-c4d6-4d57-b1e6-6d88e583e90e	40245aa3-35ab-45b1-a8c1-bf119e9c032c	ddf218eb-6151-4d8f-b07e-af714858ca7a	company.delete	company	ddf218eb-6151-4d8f-b07e-af714858ca7a	\N	\N	2026-04-30 15:32:43.180922+03
ba39b305-5635-4d74-9d82-755baf01d680	40245aa3-35ab-45b1-a8c1-bf119e9c032c	93246ec3-1054-4cad-9327-9607a349325a	user.hard_delete	user	958292e2-ff69-4d46-aa19-266cfbbb660a	\N	\N	2026-04-30 15:32:56.853466+03
98182215-0229-47bd-a04d-cfca99cb6651	40245aa3-35ab-45b1-a8c1-bf119e9c032c	93246ec3-1054-4cad-9327-9607a349325a	company.delete	company	93246ec3-1054-4cad-9327-9607a349325a	\N	\N	2026-04-30 15:33:00.175487+03
3697821e-7421-49ea-8097-f9f7136b91c3	40245aa3-35ab-45b1-a8c1-bf119e9c032c	ddf218eb-6151-4d8f-b07e-af714858ca7a	company.hard_delete	company	ddf218eb-6151-4d8f-b07e-af714858ca7a	\N	\N	2026-04-30 15:34:39.639692+03
26fcdecd-1825-425f-9dfa-2194fc9dda7a	40245aa3-35ab-45b1-a8c1-bf119e9c032c	93246ec3-1054-4cad-9327-9607a349325a	company.hard_delete	company	93246ec3-1054-4cad-9327-9607a349325a	\N	\N	2026-04-30 15:34:44.17083+03
c2bed4be-680b-481e-b256-4c69b1955d83	40245aa3-35ab-45b1-a8c1-bf119e9c032c	3042d3cb-36c8-4ad2-86f8-9efd88b9ee91	user.hard_delete	user	9926121d-631c-4354-a888-1b1aa0fe5a13	\N	\N	2026-04-30 15:34:55.755572+03
1b50903e-d685-45f4-8649-bb5b0a7c1d8e	40245aa3-35ab-45b1-a8c1-bf119e9c032c	3042d3cb-36c8-4ad2-86f8-9efd88b9ee91	user.hard_delete	user	f64ffcaf-103d-45ae-aaf6-edacd17dbad9	\N	\N	2026-04-30 15:34:58.300805+03
6a691a76-5066-4849-a562-3a8bbc80454f	40245aa3-35ab-45b1-a8c1-bf119e9c032c	3042d3cb-36c8-4ad2-86f8-9efd88b9ee91	company.hard_delete	company	3042d3cb-36c8-4ad2-86f8-9efd88b9ee91	\N	\N	2026-04-30 15:35:01.561718+03
de311649-dc51-4d50-881b-7d4094b02e8c	40245aa3-35ab-45b1-a8c1-bf119e9c032c	\N	settings.update	platform_settings	\N	\N	\N	2026-04-30 15:48:11.65337+03
7a62391c-31e1-40d2-acca-d13605bb4d7c	40245aa3-35ab-45b1-a8c1-bf119e9c032c	\N	settings.update	platform_settings	\N	\N	\N	2026-05-01 12:01:32.861965+03
5cae3d3a-8598-4c51-8ead-3e080927f705	40245aa3-35ab-45b1-a8c1-bf119e9c032c	\N	settings.update	platform_settings	\N	\N	\N	2026-05-01 12:10:08.109676+03
ae0e390c-46ec-4e20-bb84-f9c0572f08d0	40245aa3-35ab-45b1-a8c1-bf119e9c032c	\N	settings.update	platform_settings	\N	\N	\N	2026-05-01 12:11:26.302542+03
92550b16-7539-4688-878f-560ed6798ddb	40245aa3-35ab-45b1-a8c1-bf119e9c032c	\N	settings.update	platform_settings	\N	\N	\N	2026-05-01 12:13:10.442114+03
aa65fc17-a76e-4446-8b56-1028223bdc9f	40245aa3-35ab-45b1-a8c1-bf119e9c032c	\N	user.resend_invite	user	962dc6e8-b61e-4992-a7b9-4c4d797c2277	\N	\N	2026-05-01 13:24:02.572444+03
5a42082d-caab-4d5f-ba57-e38c73e731f0	40245aa3-35ab-45b1-a8c1-bf119e9c032c	\N	user.resend_invite	user	962dc6e8-b61e-4992-a7b9-4c4d797c2277	\N	\N	2026-05-01 13:33:10.981513+03
49a627fa-11b4-410a-9ec5-e0cfe141d070	40245aa3-35ab-45b1-a8c1-bf119e9c032c	432402c8-2ad5-44ae-bc36-d919ee9956e7	user.admin_create	user	581a1ca7-8c54-4bc1-98f8-5498019fa891	{"dto": {"role": "hr_admin", "email": "test_invite_v5@wellanalytics.io", "language": "tr", "full_name": "Test Invite V5", "company_id": "432402c8-2ad5-44ae-bc36-d919ee9956e7"}}	\N	2026-05-01 13:44:28.223724+03
db74455e-cd4a-470c-86b2-1abeddc0a586	40245aa3-35ab-45b1-a8c1-bf119e9c032c	432402c8-2ad5-44ae-bc36-d919ee9956e7	user.resend_invite	user	581a1ca7-8c54-4bc1-98f8-5498019fa891	\N	\N	2026-05-01 13:44:28.2802+03
57f7e11f-8d69-4b30-aa83-eabc90933119	40245aa3-35ab-45b1-a8c1-bf119e9c032c	\N	user.resend_invite	user	962dc6e8-b61e-4992-a7b9-4c4d797c2277	\N	\N	2026-05-01 14:14:03.271779+03
f001eafe-cbe9-4cef-910a-a0478ade91c2	40245aa3-35ab-45b1-a8c1-bf119e9c032c	\N	user.resend_invite	user	79c0d7dc-b452-4460-beaf-d9ff7564eec9	\N	\N	2026-05-01 14:14:48.668255+03
c779df0b-3404-4050-8459-50dc582ea28b	40245aa3-35ab-45b1-a8c1-bf119e9c032c	\N	user.resend_invite	user	962dc6e8-b61e-4992-a7b9-4c4d797c2277	\N	\N	2026-05-01 14:15:20.307875+03
f3b42284-0e60-4fbf-8b1d-0a94388094a0	79c0d7dc-b452-4460-beaf-d9ff7564eec9	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	company.create	company	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	{"name": "Onur Tech", "plan": "starter"}	\N	2026-05-03 13:46:40.769463+03
4e8c86a1-8172-4274-b7c1-0c6b2df3c04a	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	department.create	department	b57eecde-beec-42b1-91c7-29f000fa59b8	{"name": "Pazarlama"}	\N	2026-05-03 14:13:01.006553+03
f4b449ea-0368-4d7f-baf6-1f3d73a12544	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	user.bulk_invite	user	\N	{"s3Key": "uploads/csv/5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5/3870d918-7fc1-4663-a59d-90318153f9c8.csv", "error_count": 1, "success_count": 0}	\N	2026-05-03 14:57:39.364044+03
698abc61-e6e9-4cc0-8fcd-d5c7583ad0a9	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	user.bulk_invite	user	\N	{"s3Key": "uploads/csv/5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5/95d432d0-dad3-4ec9-bcea-db71d4df6d1e.csv", "error_count": 1, "success_count": 0}	\N	2026-05-03 14:58:41.827368+03
feab69c0-45dc-4d84-8025-d2c572490fae	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	user.bulk_invite	user	\N	{"s3Key": "uploads/csv/5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5/395f09f2-224f-4cc1-979e-be858312dbf0.csv", "error_count": 1, "success_count": 0}	\N	2026-05-03 14:59:50.649331+03
f9a91d56-b041-49b8-b3b7-098b1dff5c24	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	user.bulk_invite	user	\N	{"s3Key": "uploads/csv/5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5/8be16083-dd69-419f-bdd2-7921704a8e52.csv", "error_count": 1, "success_count": 0}	\N	2026-05-03 15:02:52.969998+03
25981885-76ff-440d-9072-f2fc30c3eb1b	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	user.bulk_invite	user	\N	{"s3Key": "uploads/csv/5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5/2d442380-a63d-4f1c-aeb2-198f01366e04.csv", "error_count": 1, "success_count": 0}	\N	2026-05-03 15:03:14.863003+03
21f38ad5-8af0-4a17-ba15-dec95778e2e2	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	user.bulk_invite	user	\N	{"s3Key": "uploads/csv/5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5/823ce4fe-b5e4-45e0-ab6c-45e7e34f3984.csv", "error_count": 1, "success_count": 0}	\N	2026-05-03 15:03:49.896527+03
a339d7b3-5115-4133-9987-8ea6a65cb6df	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	user.bulk_invite	user	\N	{"s3Key": "uploads/csv/5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5/bd50624f-55b3-42cb-b99b-797839c38e3d.csv", "error_count": 1, "success_count": 0}	\N	2026-05-03 15:04:03.23217+03
bf61a420-dc47-46b8-8f2a-a4f583aea518	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	user.bulk_invite	user	\N	{"s3Key": "uploads/csv/5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5/9440c5d3-bbff-4cd8-b929-4e47b946cda9.csv", "error_count": 0, "success_count": 1}	\N	2026-05-03 15:06:03.603906+03
d8848329-39ac-4335-9d60-120baa6b9a75	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	user.bulk_invite	user	\N	{"s3Key": "uploads/csv/5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5/ffe7dd34-6111-4925-b4be-237ad33ab02e.csv", "error_count": 0, "success_count": 1}	\N	2026-05-03 15:07:08.170722+03
e4433287-4213-440c-bb43-407230ea1219	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	user.bulk_invite	user	\N	{"s3Key": "uploads/csv/5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5/86ea7212-54c8-4776-b153-38a4c83effc7.csv", "error_count": 0, "success_count": 1}	\N	2026-05-03 15:07:17.492208+03
790e4f44-7374-481c-a7ea-76b6dea4bf6c	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	user.bulk_invite	user	\N	{"s3Key": "uploads/csv/5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5/4bfad236-afb3-4125-bb16-96cac36fd6a1.csv", "error_count": 0, "success_count": 1}	\N	2026-05-03 15:10:10.37036+03
b7516fff-dfba-4c47-851c-769dce4b017f	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	user.bulk_invite	user	\N	{"s3Key": "uploads/csv/5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5/e83e60e2-eba2-4ef3-b4e5-e8e90163df36.csv", "error_count": 0, "success_count": 1}	\N	2026-05-03 15:11:28.351605+03
2ab55ac9-45be-4745-af71-0f55704f1792	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	user.bulk_invite	user	\N	{"s3Key": "uploads/csv/5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5/9062441d-a96e-4a13-82de-eb8b554e8870.csv", "error_count": 0, "success_count": 1}	\N	2026-05-03 15:12:46.645912+03
44509c8d-9f16-4052-97e3-ded542e79f38	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	user.bulk_invite	user	\N	{"s3Key": "uploads/csv/5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5/44b428d7-cbe5-43ba-baaf-09bbbdc0a518.csv", "error_count": 0, "success_count": 1}	\N	2026-05-03 15:14:44.541836+03
26a878cd-c64c-49d0-98ae-1796f24e0995	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	user.bulk_invite	user	\N	{"s3Key": "uploads/csv/5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5/b2e8d035-569d-475e-a279-43c33cb7d6d2.csv", "error_count": 0, "success_count": 1}	\N	2026-05-03 15:19:19.095404+03
d2dc7457-bbec-440d-8249-86614e0be9b0	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	user.bulk_invite	user	\N	{"s3Key": "uploads/csv/5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5/16e7beb7-8524-4743-b666-a325eef92c52.csv", "error_count": 0, "success_count": 1}	\N	2026-05-03 15:20:58.307409+03
5e9aaf75-c32f-47df-9dc2-e4a4954dc6c1	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	user.resend_invite	user	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	\N	\N	2026-05-03 15:44:37.786995+03
5cf1c449-9b30-4f57-bfc9-59bc8c548912	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	user.status_change	user	7dc0c7b4-7dec-49e9-afba-3460a882e560	{"is_active": false}	\N	2026-05-03 15:45:08.88494+03
e9593030-fe1d-4a68-9043-6ee3c2f0df77	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	user.status_change	user	7dc0c7b4-7dec-49e9-afba-3460a882e560	{"is_active": true}	\N	2026-05-03 15:45:17.022506+03
821f0476-8dcf-481b-a01c-5e589a4d24a5	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	department.create	department	2a9ecc59-ad77-40e9-8b3a-c7927ae461a2	{"name": "asdaasd"}	\N	2026-05-03 19:58:44.778199+03
2bf866d3-6470-4720-b634-70f909db8bf9	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	campaign.create	DistributionCampaign	cdbdae26-3742-4313-a978-1a40b398e5ad	\N	\N	2026-05-03 21:28:55.182129+03
b2f85962-b7d8-4c92-b7ad-bb8a8fd06d72	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	campaign.create	DistributionCampaign	5ab5a134-f0c6-43d4-a440-bcbc0dc0c67c	\N	\N	2026-05-03 21:30:36.779953+03
81875727-d552-40d4-97e1-656cbad8fd47	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	report.requested	reports	\N	{"jobId": "3609444e-136b-4d1b-acbe-50543df20e65", "format": "pdf", "period": "2026-04"}	\N	2026-05-03 23:03:58.463838+03
723cd981-bae8-4404-9385-5e671a72e4fd	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	report.failed	reports	3609444e-136b-4d1b-acbe-50543df20e65	{"error": "No value provided for input HTTP label: Bucket."}	\N	2026-05-03 23:13:58.688529+03
647d2be6-5a5d-4638-bd4b-97a1ceeba4f2	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	campaign.create	DistributionCampaign	5a2695b3-0e90-4203-a61d-9da04f544b58	\N	\N	2026-05-03 23:19:34.00588+03
06a9cb04-811a-4bae-972b-aafcf7b98211	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	campaign.create	DistributionCampaign	ad788ad1-d2cc-4538-9a70-2493a8469bb4	\N	\N	2026-05-03 23:25:07.930216+03
d706614d-398c-4933-a7b0-6b1acbb76a24	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	campaign.create	DistributionCampaign	877b4308-f047-43e0-8157-8c4ed4e79efb	\N	\N	2026-05-03 23:29:31.49825+03
a667329b-dbe6-42f9-8bda-efb6a0de994c	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	campaign.create	DistributionCampaign	32337f98-3e89-4be4-a7a2-77b8eeac15fe	\N	\N	2026-05-03 23:30:42.449682+03
cf0045a4-dc47-479f-93fb-a8467029d089	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	campaign.create	DistributionCampaign	3ce4d559-c663-4eab-986c-b69535fc5a37	\N	\N	2026-05-03 23:34:15.372694+03
a63b4d0a-6292-4ce0-8f82-036f52c9266b	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	campaign.create	DistributionCampaign	f42c43cb-e79f-4a0d-a05d-3810b7b7d06e	\N	\N	2026-05-03 23:36:10.313078+03
d0a76ba9-74b7-42b4-b59d-accf77258ff7	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	report.requested	reports	\N	{"jobId": "4fd6addc-3290-48bd-9f11-f0eaba9784c8", "format": "pdf", "period": "2026-05"}	\N	2026-05-03 23:50:07.062453+03
bea130bb-fd69-461e-8dd1-9b38b8303253	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	report.failed	reports	4fd6addc-3290-48bd-9f11-f0eaba9784c8	{"error": "No value provided for input HTTP label: Bucket."}	\N	2026-05-04 00:00:07.266851+03
c1adccd1-91c2-4ddb-9b33-49018311c988	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	action.status_change	actions	8eb5bfec-9065-4206-bcb9-ce8f2bb55970	{"to": "in_progress", "from": "planned"}	\N	2026-05-04 00:37:39.843664+03
9db20d4c-1242-497b-9531-cc8c400d637d	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	action.status_change	actions	38f009df-d94a-44cc-953d-887da76eb0ba	{"to": "completed", "from": "in_progress"}	\N	2026-05-04 00:38:31.72605+03
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.companies (id, name, slug, industry, size_band, plan, plan_expires_at, is_active, contact_email, logo_url, settings, created_at, created_by, consultant_id) FROM stdin;
77777777-7777-7777-7777-777777777777	Cerrahi Test Co	cerrahi-test	\N	\N	pro	\N	t	contact@cerrahi.com	\N	{}	2026-05-01 13:44:15.098167+03	\N	\N
432402c8-2ad5-44ae-bc36-d919ee9956e7	Real UUID Co	real-432402c8	\N	\N	pro	\N	t	c@c.com	\N	{}	2026-05-01 13:44:28.171295+03	\N	\N
5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	Onur Tech	onur-tech	finance	1-50	starter	\N	t	onureksi82@gmail.com	\N	{"default_language": "tr", "benchmark_visible": true, "employee_accounts": false, "anonymity_threshold": 5}	2026-05-03 13:46:40.750872+03	79c0d7dc-b452-4460-beaf-d9ff7564eec9	79c0d7dc-b452-4460-beaf-d9ff7564eec9
\.


--
-- Data for Name: consultant_plans; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.consultant_plans (id, consultant_id, plan, max_companies, max_employees, ai_enabled, white_label, custom_domain, valid_until, is_active, created_at, brand_name, brand_logo_url, brand_color, brand_favicon_url, custom_domain_verified) FROM stdin;
\.


--
-- Data for Name: content_items; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.content_items (id, title_tr, title_en, description_tr, description_en, type, dimension, url_tr, url_en, score_threshold, is_active, created_by, created_at, consultant_id) FROM stdin;
ac483d25-4f13-49ef-8712-203e1f8dd348	Stres Yönetimi ve Mindfulness	Stress Management and Mindfulness	Günlük iş stresini yönetmek için temel teknikler.	\N	video	mental	https://www.youtube.com/watch?v=inpok4MKVLM	\N	60	t	\N	2026-05-04 00:34:59.683969+03	\N
bcc43451-1573-4849-8a9a-2ace1b98af62	Sağlıklı Beslenme Rehberi	Healthy Nutrition Guide	Ofis ortamında sağlıklı beslenme ipuçları.	\N	article	physical	https://example.com/beslenme	\N	70	t	\N	2026-05-04 00:34:59.683969+03	\N
cf25dec9-e085-489f-a599-ef9618eb7a78	Ekip İçi İletişim Stratejileri	Team Communication Strategies	Hibrit çalışma modelinde etkili iletişim.	\N	video	social	https://example.com/iletisim	\N	65	t	\N	2026-05-04 00:34:59.683969+03	\N
af54c2be-6b9b-4b19-99e9-8c975045fd38	Finansal Okuryazarlık 101	Financial Literacy 101	Bireysel bütçe yönetimi ve tasarruf.	\N	video	financial	https://example.com/finans	\N	50	t	\N	2026-05-04 00:34:59.683969+03	\N
708e802f-1d95-4a43-a03d-ee3adda69121	Zaman Yönetimi Teknikleri	Time Management Techniques	Pomodoro ve Eisenhower matrisi ile verimlilik.	\N	article	work	https://example.com/zaman	\N	60	t	\N	2026-05-04 00:34:59.683969+03	\N
5f24777a-21e3-4285-9447-1d7398b6c6d2	Uyku Kalitesini Artırma	Improving Sleep Quality	Daha enerjik bir gün için uyku hijyeni.	\N	video	physical	https://example.com/uyku	\N	55	t	\N	2026-05-04 00:34:59.683969+03	\N
\.


--
-- Data for Name: credit_balances; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.credit_balances (id, consultant_id, credit_type_key, balance, used_this_month, last_reset_at, updated_at) FROM stdin;
16250041-d83d-4f1f-8d9a-bc4626c9c1e7	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	14250	0	2026-05-01 00:44:39.438	2026-05-01 00:44:39.438032
1d191164-fc4a-44e3-8fc8-6280b7064ead	79c0d7dc-b452-4460-beaf-d9ff7564eec9	mail_credit	71400	0	2026-05-01 00:44:39.443	2026-05-01 00:44:39.442732
\.


--
-- Data for Name: credit_transactions; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.credit_transactions (id, consultant_id, credit_type_key, amount, type, description, company_id, reference_id, created_at) FROM stdin;
539f4f3f-2fd1-4574-bfb0-79d629e2bb9c	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-45	usage	AI Analiz Sorgusu	\N	\N	2026-04-19 17:35:43.587897
a37fabd9-da05-4900-a1ca-93a340158249	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-55	usage	AI Analiz Sorgusu	\N	\N	2026-04-14 17:35:43.602732
d0433fe4-f2f9-47ca-b1c0-9968bbf6e7d8	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-46	usage	AI Analiz Sorgusu	\N	\N	2026-04-09 17:35:43.603327
8b42aa0a-4a5b-4311-b493-a5862aaa24aa	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-43	usage	AI Analiz Sorgusu	\N	\N	2026-04-16 17:35:43.603791
b43e17e4-5233-446a-a87f-5b957ce2e1a0	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-42	usage	AI Analiz Sorgusu	\N	\N	2026-04-17 17:35:43.60429
9b9794d9-77f7-4a86-b51c-37f7e2a4508c	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-53	usage	AI Analiz Sorgusu	\N	\N	2026-04-04 17:35:43.604719
5c48ef5e-4b3c-4116-91c7-be158892ba71	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-37	usage	AI Analiz Sorgusu	\N	\N	2026-04-12 17:35:43.605125
2e361bdf-607c-4c24-b403-c1403bffc245	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-25	usage	AI Analiz Sorgusu	\N	\N	2026-04-12 17:35:43.605426
1aad2ec7-42ac-40cc-9f53-668304d21cdc	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-46	usage	AI Analiz Sorgusu	\N	\N	2026-04-01 17:35:43.605676
f812c232-7e95-4126-aeab-1672a3cc66c5	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-30	usage	AI Analiz Sorgusu	\N	\N	2026-04-22 17:35:43.605921
ba4d5fdf-a1fb-4535-8610-d1d575fb221a	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-48	usage	AI Analiz Sorgusu	\N	\N	2026-04-01 17:35:43.606151
748b2937-23b1-4a39-ab28-8368b951b75f	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-51	usage	AI Analiz Sorgusu	\N	\N	2026-04-20 17:35:43.606389
9c45818f-5dd2-4b11-8793-6988641a238e	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-34	usage	AI Analiz Sorgusu	\N	\N	2026-04-29 17:35:43.606651
925c43ea-bcd1-419e-8de2-48a56c327e6d	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-32	usage	AI Analiz Sorgusu	\N	\N	2026-04-08 17:35:43.606894
1e65e25d-90a9-410c-af01-c0da558d10c9	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-47	usage	AI Analiz Sorgusu	\N	\N	2026-04-05 17:35:43.607146
9d82a4de-4dbd-441e-9422-e9c7d7becc0c	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-49	usage	AI Analiz Sorgusu	\N	\N	2026-04-09 17:35:43.607425
7ae4fd07-4d89-470e-8235-1159dbcc0632	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-22	usage	AI Analiz Sorgusu	\N	\N	2026-04-25 17:35:43.607643
be9b4e11-a923-40ba-9d4e-d06d48973e5f	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-27	usage	AI Analiz Sorgusu	\N	\N	2026-04-09 17:35:43.607909
1c4d130f-20be-468c-8b30-b6341396017d	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-32	usage	AI Analiz Sorgusu	\N	\N	2026-04-21 17:35:43.608176
85fcb568-34ef-4a6e-b674-175844007706	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	-10	usage	AI Analiz Sorgusu	\N	\N	2026-04-01 17:35:43.608448
61048476-38e4-4808-bcca-b3d9c005d156	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	5000	reset	Aylık Abonelik Kredi Yenilemesi: growth_monthly	\N	\N	2026-05-01 00:44:39.393047
3fd8f49a-adc7-44bc-9631-c5cc4356c0bd	79c0d7dc-b452-4460-beaf-d9ff7564eec9	mail_credit	25000	reset	Aylık Abonelik Kredi Yenilemesi: growth_monthly	\N	\N	2026-05-01 00:44:39.431886
ff415307-d11e-4a61-b718-9fcd2c950d46	79c0d7dc-b452-4460-beaf-d9ff7564eec9	ai_credit	5000	reset	Aylık Abonelik Kredi Yenilemesi: growth_monthly	\N	\N	2026-05-01 00:44:39.438032
592a3671-7926-4280-ad0e-c14465c78b23	79c0d7dc-b452-4460-beaf-d9ff7564eec9	mail_credit	25000	reset	Aylık Abonelik Kredi Yenilemesi: growth_monthly	\N	\N	2026-05-01 00:44:39.442732
\.


--
-- Data for Name: credit_types; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.credit_types (key, label_tr, label_en, description_tr, description_en, icon, color, sort_order, is_active, created_at, updated_at) FROM stdin;
ai_credit	AI Analiz Kredisi	AI Analysis Credit	\N	\N	Brain	#6C3A8E	1	t	2026-04-30 17:35:43.554115	2026-04-30 17:35:43.554115
mail_credit	Mail Kredisi	Mail Credit	\N	\N	Mail	#1A5C3A	2	t	2026-04-30 17:35:43.554115	2026-04-30 17:35:43.554115
\.


--
-- Data for Name: demo_requests; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.demo_requests (id, full_name, email, company_name, company_size, industry, phone, message, status, notes, created_at, updated_at, assigned_to) FROM stdin;
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.departments (id, company_id, name, is_active, created_at) FROM stdin;
b57eecde-beec-42b1-91c7-29f000fa59b8	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	Pazarlama	t	2026-05-03 14:13:00.994104+03
5acef875-4642-4e3f-a5b3-59e3b8e69a3c	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	Software	t	2026-05-03 15:03:49.89077+03
bbec1c7b-cc00-4f19-a90c-c2e5491447d7	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	Yeni Otomatik Departman	t	2026-05-03 19:57:48.411072+03
2a9ecc59-ad77-40e9-8b3a-c7927ae461a2	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	asdaasd	t	2026-05-03 19:58:44.770343+03
\.


--
-- Data for Name: distribution_campaigns; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.distribution_campaigns (id, company_id, survey_id, total_recipients, sent_count, delivered_count, opened_count, clicked_count, completed_count, assignment_id, period, created_by, trigger_type, scheduled_at, sent_at, status, created_at, updated_at) FROM stdin;
cdbdae26-3742-4313-a978-1a40b398e5ad	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	73f06599-8dcb-4dbf-9167-c3b61bf79896	1	1	0	0	0	0	\N	\N	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	hr_manual	\N	2026-05-03 21:28:55.287	sent	2026-05-03 21:28:55.168168	2026-05-03 21:28:55.293068
5ab5a134-f0c6-43d4-a440-bcbc0dc0c67c	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	73f06599-8dcb-4dbf-9167-c3b61bf79896	1	1	0	0	0	0	\N	\N	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	hr_manual	\N	2026-05-03 21:30:36.834	sent	2026-05-03 21:30:36.769071	2026-05-03 21:30:36.838491
5a2695b3-0e90-4203-a61d-9da04f544b58	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	73f06599-8dcb-4dbf-9167-c3b61bf79896	0	0	0	0	0	0	\N	\N	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	hr_manual	\N	2026-05-03 23:19:34.02	sent	2026-05-03 23:19:33.994862	2026-05-03 23:19:34.022305
ad788ad1-d2cc-4538-9a70-2493a8469bb4	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	73f06599-8dcb-4dbf-9167-c3b61bf79896	1	1	0	0	0	1	\N	\N	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	hr_manual	\N	2026-05-03 23:25:07.963	sent	2026-05-03 23:25:07.922564	2026-05-03 23:25:07.963962
877b4308-f047-43e0-8157-8c4ed4e79efb	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	73f06599-8dcb-4dbf-9167-c3b61bf79896	1	1	0	0	0	1	\N	\N	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	hr_manual	\N	2026-05-03 23:29:31.528	sent	2026-05-03 23:29:31.49207	2026-05-03 23:29:31.529641
32337f98-3e89-4be4-a7a2-77b8eeac15fe	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	73f06599-8dcb-4dbf-9167-c3b61bf79896	1	1	0	0	0	1	\N	\N	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	hr_manual	\N	2026-05-03 23:30:42.515	sent	2026-05-03 23:30:42.43261	2026-05-03 23:30:42.521143
3ce4d559-c663-4eab-986c-b69535fc5a37	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	73f06599-8dcb-4dbf-9167-c3b61bf79896	1	1	0	0	0	1	\N	\N	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	hr_manual	\N	2026-05-03 23:34:15.393	sent	2026-05-03 23:34:15.366875	2026-05-03 23:34:15.39476
f42c43cb-e79f-4a0d-a05d-3810b7b7d06e	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	73f06599-8dcb-4dbf-9167-c3b61bf79896	1	1	0	0	1	1	\N	\N	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	hr_manual	\N	2026-05-03 23:36:10.332	sent	2026-05-03 23:36:10.300864	2026-05-03 23:36:51.96328
\.


--
-- Data for Name: distribution_logs; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.distribution_logs (id, campaign_id, company_id, full_name, user_id, mail_provider_id, bounce_reason, retry_count, email, survey_token_id, status, sent_at, opened_at, clicked_at, completed_at, created_at) FROM stdin;
c813a6a2-0e8d-46a7-a6a3-ac7ae5a4d8e2	cdbdae26-3742-4313-a978-1a40b398e5ad	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	Test User	\N	\N	\N	0	test@example.com	6c4783c8-3efe-4e0c-a010-c631303f9562	sent	2026-05-03 21:28:55.266	\N	\N	\N	2026-05-03 21:28:55.232329
cadcf5f4-e2be-4e54-9f29-d5946a26804d	5ab5a134-f0c6-43d4-a440-bcbc0dc0c67c	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	Test User	\N	\N	\N	0	test@example.com	6c4783c8-3efe-4e0c-a010-c631303f9562	sent	2026-05-03 21:30:36.822	\N	\N	\N	2026-05-03 21:30:36.797685
10c98e5f-9173-403a-88ab-86bc0f45615e	ad788ad1-d2cc-4538-9a70-2493a8469bb4	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	Onur Ekşi	\N	\N	\N	0	onuroctoplus@gmail.com	731d5b70-86e6-4174-a496-dc41ff4a09f3	sent	2026-05-03 23:25:07.958	\N	\N	2026-05-03 23:49:25.536285	2026-05-03 23:25:07.9488
69789b8e-ab2b-4500-98bd-8d2a552ce395	877b4308-f047-43e0-8157-8c4ed4e79efb	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	Onur Ekşi	\N	\N	\N	0	onuroctoplus@gmail.com	731d5b70-86e6-4174-a496-dc41ff4a09f3	sent	2026-05-03 23:29:31.524	\N	\N	2026-05-03 23:49:25.536285	2026-05-03 23:29:31.512937
320e0ba1-68f9-49c6-9959-0002637c229b	32337f98-3e89-4be4-a7a2-77b8eeac15fe	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	Onur Ekşi	\N	\N	\N	0	onuroctoplus@gmail.com	731d5b70-86e6-4174-a496-dc41ff4a09f3	sent	2026-05-03 23:30:42.506	\N	\N	2026-05-03 23:49:25.536285	2026-05-03 23:30:42.494022
0e042867-473e-494e-94ed-9eef6fffcefd	3ce4d559-c663-4eab-986c-b69535fc5a37	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	Onur Ekşi	\N	\N	\N	0	onuroctoplus@gmail.com	731d5b70-86e6-4174-a496-dc41ff4a09f3	sent	2026-05-03 23:34:15.39	\N	\N	2026-05-03 23:49:25.536285	2026-05-03 23:34:15.382863
726e5fa5-adf3-4fc7-a7ac-a1bcfbfa0cc1	f42c43cb-e79f-4a0d-a05d-3810b7b7d06e	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	Onur Ekşi	\N	\N	\N	0	onuroctoplus@gmail.com	731d5b70-86e6-4174-a496-dc41ff4a09f3	sent	2026-05-03 23:36:10.329	\N	2026-05-03 23:36:51.958	2026-05-03 23:49:25.536285	2026-05-03 23:36:10.323284
\.


--
-- Data for Name: draft_responses; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.draft_responses (id, survey_id, user_id, token, answers, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.employees (id, company_id, department_id, full_name, email, "position", start_date, is_active, created_at, updated_at, deactivated_at) FROM stdin;
410993b7-d47e-4e79-b56b-a952d2204653	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	b57eecde-beec-42b1-91c7-29f000fa59b8	Onur Ekşi	onuroctoplus@gmail.com		\N	t	2026-05-03 22:31:34.959607	2026-05-03 22:31:34.959607	\N
1ff29429-0102-4cc9-8dbb-caff277305fb	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	5acef875-4642-4e3f-a5b3-59e3b8e69a3c	Ali veli	10ureksi@gmail.com	Developer	\N	t	2026-05-04 00:42:03.922144	2026-05-04 00:42:03.922144	\N
\.


--
-- Data for Name: industries; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.industries (id, slug, label_tr, label_en, is_active, is_default, order_index, created_at, updated_at) FROM stdin;
26580748-176d-4483-a5d7-da1723f4413a	finance	Finans & Bankacılık	Finance & Banking	t	t	2	2026-04-28 14:34:17.008109	2026-04-28 14:34:17.008109
e2f90057-e99a-44b2-ab8c-f73df7dad725	healthcare	Sağlık	Healthcare	t	t	3	2026-04-28 14:34:17.008109	2026-04-28 14:34:17.008109
0be6f75f-8199-46b2-ab65-28519d70db40	retail	Perakende	Retail	t	t	4	2026-04-28 14:34:17.008109	2026-04-28 14:34:17.008109
8dce085f-fce4-404f-88ef-709d6164f648	manufacturing	Üretim & Sanayi	Manufacturing	t	t	5	2026-04-28 14:34:17.008109	2026-04-28 14:34:17.008109
9946262f-0140-495e-8797-963c91b93784	education	Eğitim	Education	t	t	6	2026-04-28 14:34:17.008109	2026-04-28 14:34:17.008109
56e5c6b4-a76c-4fb3-8fae-3ff2f79c2a34	logistics	Lojistik & Taşımacılık	Logistics	t	t	7	2026-04-28 14:34:17.008109	2026-04-28 14:34:17.008109
03991e29-ca3b-4cf2-a0a5-3d36688b038e	energy	Enerji	Energy	t	t	8	2026-04-28 14:34:17.008109	2026-04-28 14:34:17.008109
20dfa083-5f83-4f8a-b8e3-cda0e09d4fba	construction	İnşaat & Gayrimenkul	Construction	t	t	9	2026-04-28 14:34:17.008109	2026-04-28 14:34:17.008109
1441306c-1c53-443d-a50b-01405d6a11f2	media	Medya & İletişim	Media	t	t	10	2026-04-28 14:34:17.008109	2026-04-28 14:34:17.008109
57091379-d75a-4ae4-ba35-e0b3bed88f4f	tourism	Turizm & Otelcilik	Tourism	t	t	11	2026-04-28 14:34:17.008109	2026-04-28 14:34:17.008109
356c031f-cba8-4d4c-89f8-45f8ab9382f0	food_beverage	Gıda & İçecek	Food & Beverage	t	t	12	2026-04-28 14:34:17.008109	2026-04-28 14:34:17.008109
2b433fcb-7781-4819-acb5-ff500e9bd8b9	automotive	Otomotiv	Automotive	t	t	13	2026-04-28 14:34:17.008109	2026-04-28 14:34:17.008109
22c2a67e-fcf0-448e-894c-664ad83bb39d	telecom	Telekomünikasyon	Telecommunications	t	t	14	2026-04-28 14:34:17.008109	2026-04-28 14:34:17.008109
eeded5e6-bf85-4e26-bd99-a60cd8c74397	insurance	Sigorta	Insurance	t	t	15	2026-04-28 14:34:17.008109	2026-04-28 14:34:17.008109
cc2c2e02-81b0-4ad1-b552-4171fa2a5bfe	consulting	Danışmanlık	Consulting	t	t	16	2026-04-28 14:34:17.008109	2026-04-28 14:34:17.008109
a1b76962-946c-4038-831b-b5dd21f93e80	public_sector	Kamu Sektörü	Public Sector	t	t	17	2026-04-28 14:34:17.008109	2026-04-28 14:34:17.008109
50a7c343-5b07-4c93-bf8c-d98006a7dd52	ngo	STK & Sivil Toplum	NGO & Civil Society	t	t	18	2026-04-28 14:34:17.008109	2026-04-28 14:34:17.008109
26cace87-ac70-4402-a03c-029fd5529009	other	Diğer	Other	t	t	19	2026-04-28 14:34:17.008109	2026-04-28 14:34:17.008109
cccecd23-d693-462e-b357-3ccfbb32f287	technology	Teknoloji	Technology	t	t	2	2026-04-28 14:34:17.008109	2026-04-28 15:02:20.882657
\.


--
-- Data for Name: industry_benchmark_scores; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.industry_benchmark_scores (id, industry, region, dimension, score, source, source_year, is_seed, updated_by, updated_at, created_at) FROM stdin;
aa18727d-0bd4-4247-acb4-a407e58c5d9a	technology	global	overall	64.00	Gallup 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
d5af8227-60b0-42b2-98bc-52eba5fe24a5	technology	global	physical	67.00	Intellect 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
8a6d485a-3504-4841-b2da-88eb61ea8a21	technology	global	mental	59.00	Gallup 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
da6188de-8cf1-482e-b455-e04259ef043d	technology	global	social	62.00	Gallup 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
acf7f372-def3-474d-9805-b5038fe1ef8f	technology	global	financial	63.00	Mercer 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
94a08da3-5c87-4c64-9af5-091d75b917c1	technology	global	work	69.00	Gallup 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
793dd856-4026-4cca-a4d9-1261eaf9fca2	technology	turkey	overall	59.00	WTW 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
305e280f-0c97-483f-91ad-fd38c93e37c3	technology	turkey	physical	62.00	WTW 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
7ba8b0e6-9f02-4517-8e42-9fbed9d1ed55	technology	turkey	mental	54.00	WTW 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
1a09d701-fe19-4ebf-9bb6-462bcd2a3b34	technology	turkey	social	58.00	WTW 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
915ef970-0025-4888-9b2e-73afd2ab0c27	technology	turkey	financial	55.00	WTW 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
1907a416-8470-42c9-aa98-7f0735c9f11e	technology	turkey	work	65.00	Moodivation 2025	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
bcb31f72-60e6-46a4-a4c0-fb51864ceadf	finance	global	overall	61.00	Gallup 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
473a1f56-6289-42ad-ab1c-fb9570b5ac04	finance	global	physical	60.00	Intellect 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
40a609d0-7e2e-4651-8357-dda2d7a7f944	finance	global	mental	55.00	Gallup 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
88109d44-46f1-4c5f-91ac-d58af7047810	finance	global	social	62.00	Gallup 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
a2d887a6-ae7b-463a-94f9-d85bf0f6ac61	finance	global	financial	70.00	Mercer 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
71d231f1-6f0a-4e7d-a022-94d4a4db5d33	finance	global	work	61.00	Gallup 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
01dad716-c092-45a2-b6a4-8b2f5d82838d	finance	turkey	overall	56.00	WTW 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
8810efb9-0ade-4624-92b6-71e346723f3c	finance	turkey	physical	55.00	WTW 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
21c3dcf3-6030-4abd-953e-10048c458542	finance	turkey	mental	50.00	Moodivation 2025	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
2a73f0ae-ea9f-4dd0-a528-26c44daac15f	finance	turkey	social	57.00	WTW 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
e9bb9f1c-66c5-4d15-a3bd-c8d22e825674	finance	turkey	financial	62.00	WTW 2024	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
ab38679e-857a-47d3-90f0-e219e95c908f	finance	turkey	work	56.00	Moodivation 2025	2024	t	\N	2026-05-04 00:57:21.042772	2026-05-04 00:57:21.042772
3cde7769-c545-4da2-933e-55691cbc7442	healthcare	global	overall	60.00	Intellect 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
039521a3-6d25-47bf-ab38-cd3fc2eb87f3	healthcare	global	physical	62.00	Intellect 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
5b7783a6-ebf8-4761-ac3c-b2b221002156	healthcare	global	mental	50.00	Better Being 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
4c35bff6-03d6-465f-88ef-828a36bdf393	healthcare	global	social	68.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
6733024e-04bf-4404-a809-09aeca3815c5	healthcare	global	financial	49.00	Mercer 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
f9ed62ce-cacf-4725-a0b9-4d63c0f769c3	healthcare	global	work	73.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
c692b257-b574-4de9-b00e-4822ce7163ce	healthcare	turkey	overall	55.00	WTW 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
218799b5-6192-459f-ba04-cd1c3b6a5659	healthcare	turkey	physical	57.00	WTW 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
a5c99fa5-a3fa-4571-ab95-b75965b3371f	healthcare	turkey	mental	45.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
778b11ab-38e3-450a-b106-7cc1ff74cb0f	healthcare	turkey	social	63.00	WTW 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
a128f8af-4baf-4c99-8ce5-77794175f3ce	healthcare	turkey	financial	44.00	WTW 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
c0c9817b-0f4f-4553-98d7-322009280926	healthcare	turkey	work	68.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
7be8356a-27f0-40ea-9fc9-eeb87d9fbf57	manufacturing	global	overall	54.00	Better Being 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
e0986b2d-f9cd-48f7-9557-88cfd80006a4	manufacturing	global	physical	53.00	Better Being 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
2a2c61e1-6c63-4a6b-a302-455c216db030	manufacturing	global	mental	51.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
4642e7a4-faa8-4bdf-86f8-ce5540dd59b0	manufacturing	global	social	57.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
9f08508f-adb0-4784-8dea-e6932ecfd653	manufacturing	global	financial	52.00	Mercer 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
1379acbf-3761-43f1-b281-932876a15847	manufacturing	global	work	55.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
5bc08bc9-9030-4b32-9167-4bee4fc2fe64	manufacturing	turkey	overall	49.00	WTW 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
978bc78d-dff3-4ef2-bd1c-de0cd9ea92d5	manufacturing	turkey	physical	48.00	İŞKUR 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
085cf5fa-6f0f-4930-afac-c273cbb1c144	manufacturing	turkey	mental	46.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
6583f1e0-ef8e-422d-b1f8-abb438dcf600	manufacturing	turkey	social	52.00	WTW 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
1c2379b8-b6f7-4921-8009-30a613bbf9eb	manufacturing	turkey	financial	47.00	WTW 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
aac6a102-147d-42b0-930c-a2a06c3a1cf9	manufacturing	turkey	work	50.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
ed9a0c4b-35bc-4b82-81f7-a4e7dc3940dd	retail	global	overall	52.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
45377adf-29d3-489c-a376-214c01a0bfb4	retail	global	physical	56.00	Intellect 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
677a3de1-f880-4583-869a-0c52c84eb257	retail	global	mental	49.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
fca2a774-7ac8-494f-93bc-54cc4ded4653	retail	global	social	60.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
329bc136-722d-4b38-a6d9-721b93cb66cb	retail	global	financial	47.00	Mercer 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
5056cb79-6051-4eca-84ee-bedaa25a0d0a	retail	global	work	53.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
062b08f7-429b-458d-90cc-63a8f45696aa	retail	turkey	overall	48.00	WTW 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
ceb559cc-0830-4d83-81df-8df12cf4e599	retail	turkey	physical	51.00	WTW 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
86f40530-e247-4ae0-9a8a-f472800c1284	retail	turkey	mental	44.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
4390cc2b-aad6-49d5-9420-6f1a76db0997	retail	turkey	social	55.00	WTW 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
5f06e6a6-7418-48aa-99ff-13cbe5c7828f	retail	turkey	financial	42.00	WTW 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
6de04bba-73c7-4015-a3ed-63262491bf88	retail	turkey	work	48.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
036977a5-65a4-4463-8d22-51e674b2a050	logistics	global	overall	52.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
65f12988-9d2b-429c-899b-418d9b0a7025	logistics	global	physical	51.00	ILO 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
3164659e-fb8e-43d3-8baf-75192203293a	logistics	global	mental	50.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
e8c6ca72-10b0-483f-9227-9afd786a1038	logistics	global	social	55.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
8884d15a-a106-40e3-9526-c80f0650c7b5	logistics	global	financial	51.00	Mercer 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
8e610f4e-ea30-4f59-9c50-d85a98c29188	logistics	global	work	52.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
5dcbad18-f4a5-4dc6-bac7-47b1df397d7c	logistics	turkey	overall	47.00	WTW 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
4339e965-d56f-4e4e-b40e-a628f163ab19	logistics	turkey	physical	46.00	İŞKUR 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
07e6c0fc-1881-488a-8589-99a6a4fb0ff6	logistics	turkey	mental	45.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
11fc34d5-3d75-4833-b033-66205e9cdf13	logistics	turkey	social	50.00	WTW 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
1f87040d-0bea-400c-8035-cf71e7640fbd	logistics	turkey	financial	46.00	WTW 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
8c1a14d9-a819-4315-9bd5-07e2c2765636	logistics	turkey	work	47.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
054576f8-ab1e-45bf-8341-a4d1fdcf1100	education	global	overall	59.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
f7a5680a-34a9-4211-a727-523266a3aab9	education	global	physical	59.00	Intellect 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
d1df2d25-0e8c-4085-b5ea-ac9ad0b9cfd4	education	global	mental	52.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
6b30265e-0966-472e-9710-0a37a31ffda3	education	global	social	70.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
68fd605a-abc2-4ed8-ad2d-8398ad1944cd	education	global	financial	45.00	Mercer 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
49cef321-3aae-460d-a90e-b2ac80224397	education	global	work	71.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
0fdc8d87-ae2f-4519-a4e0-0b5eca6a3e20	education	turkey	overall	54.00	WTW 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
f4678ca9-ae33-48a9-ba89-accac25864ef	education	turkey	physical	54.00	WTW 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
d9eac10d-8be4-49c8-88e7-c143865a04a1	education	turkey	mental	47.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
ddcd8838-79ff-4f0f-990c-0b5dea96f147	education	turkey	social	65.00	WTW 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
15b564a4-76fa-4d58-a799-9ae250befb0f	education	turkey	financial	40.00	WTW 2024	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
3c1afc7d-083f-4166-9f1d-ff9fb0fd9d24	education	turkey	work	66.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:32.842499	2026-05-04 00:58:32.842499
9a69509d-f2aa-45ee-91fd-e03edb6c1249	media	global	overall	63.00	Intellect 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
3c25c2a2-adc3-41bf-8f06-e570b6644ead	media	global	physical	68.00	Intellect 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
a9b16084-5d68-42c7-afd2-9c8611e3267c	media	global	mental	57.00	Intellect 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
61ba63f5-68a2-405c-a4c7-c0ec2325a5d8	media	global	social	65.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
da9dc2e9-6772-47aa-b129-98eb47099b15	media	global	financial	55.00	Mercer 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
fb1a68ef-cd4c-4c0d-9463-05fbc57f3dbd	media	global	work	69.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
fe25c5ee-652d-4ee7-bb20-4e0a9567fc8c	media	turkey	overall	58.00	WTW 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
4be4c379-623b-4668-afd7-97db6ec8cb65	media	turkey	physical	63.00	WTW 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
e712855f-08bf-48ca-bb64-6ab2f65fc33a	media	turkey	mental	52.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
0d7c3610-4734-4db8-9164-840817240735	media	turkey	social	60.00	WTW 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
6b4ddcf6-8ec9-45cd-b3a7-703e17cbdf9c	media	turkey	financial	50.00	WTW 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
51945c7c-aa4c-4fcf-a762-dcd182316130	media	turkey	work	64.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
477ae4f5-65ba-48bf-9b04-3b40c81667ab	construction	global	overall	54.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
610ca62f-f874-4618-afe9-f634020b0347	construction	global	physical	54.00	ILO 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
b7973e09-d47e-43b6-a45d-16b70b1e0b9b	construction	global	mental	49.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
2abb4ace-88c6-446b-88a9-6ac67fb5224f	construction	global	social	56.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
8ddd7cd5-86ca-4a38-9680-cbae91b96e17	construction	global	financial	57.00	Mercer 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
02a42aac-a763-4391-8de7-a8e08966b399	construction	global	work	53.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
dfae6f92-f865-4763-8ee1-accfdaf63d66	construction	turkey	overall	49.00	WTW 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
666a640a-7ad1-4695-9945-0d989313de89	construction	turkey	physical	49.00	SGK 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
546d6c5d-8ab2-47ac-ae34-a2877334c54a	construction	turkey	mental	44.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
d5c2acc9-3e9e-4a3e-8763-1dfde8a4808d	construction	turkey	social	51.00	WTW 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
3acad8f9-fb98-49c3-984d-2043e4c818cb	construction	turkey	financial	52.00	WTW 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
c05481ff-4fd8-48bc-b147-c7c01c5ab095	construction	turkey	work	48.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
893612d6-b769-4431-8dda-f5dc332d4596	tourism	global	overall	55.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
0b5c4b14-04e0-4c35-be3a-33d3db187af5	tourism	global	physical	58.00	Intellect 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
88599a25-bdee-49a8-bcf7-46d730d13001	tourism	global	mental	47.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
325046dd-3f21-483e-be59-2a95d368ba79	tourism	global	social	66.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
f22de0b3-1b85-4004-93e8-b6ee2359b567	tourism	global	financial	43.00	Mercer 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
a4591427-15e6-4e2d-be0a-3bd20baa7623	tourism	global	work	59.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
ee8b2054-4523-4f72-8880-76f3bcf71cc4	tourism	turkey	overall	50.00	WTW 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
16f3effe-aa70-425f-b813-e3bae89523a0	tourism	turkey	physical	53.00	İŞKUR 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
8d5119b8-0614-4d04-9e60-6eaa0d4735a2	tourism	turkey	mental	42.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
5e7eadd3-f2f3-4636-9c4e-291ef37535cf	tourism	turkey	social	61.00	WTW 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
dc4fc0f1-27b1-49c5-ada6-01d7a65c36b1	tourism	turkey	financial	38.00	WTW 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
4680c392-212e-42e0-ad4a-62313e6547d0	tourism	turkey	work	54.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
4b7e61b1-62ea-49d5-9f17-1bc469c8ec7a	energy	global	overall	57.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
04fa7b32-14b1-4279-af95-661cad9103bd	energy	global	physical	57.00	ILO 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
6d7429b7-a590-41be-b173-f7e94f7281a4	energy	global	mental	53.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
eb155858-7981-43aa-b778-2b3d577dd886	energy	global	social	58.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
23b52e2c-474d-46ff-99da-4b81f3f1baa5	energy	global	financial	61.00	Mercer 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
2675af30-4f69-4e8c-982f-586fd21aa4f6	energy	global	work	56.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
7c3288e2-90ce-4c72-ac96-eebcdd809758	energy	turkey	overall	52.00	WTW 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
e1e93835-b039-4ee1-b687-cd991f0882cb	energy	turkey	physical	52.00	SGK 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
d20e2504-3701-4fba-96df-8f214eed1f7c	energy	turkey	mental	48.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
cb6c6fca-fa0d-4c53-aac3-940b932f2f2d	energy	turkey	social	53.00	WTW 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
214559bf-1d98-45e6-9274-66d0f4115ccb	energy	turkey	financial	56.00	WTW 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
7e03ce4a-a838-496a-ae13-79e9885064d5	energy	turkey	work	51.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
d195e486-1a16-4f11-a3e6-c7873c76d56f	public	global	overall	56.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
4f8492c9-eabc-4f4a-99da-38dd230fb16d	public	global	physical	58.00	Intellect 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
27dc10d0-8086-44ff-a460-f081289be88c	public	global	mental	51.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
e573e4d3-6897-46c9-b35e-0103960d6340	public	global	social	65.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
2fd48eff-f2ae-47a1-b360-799c8f8f400b	public	global	financial	48.00	Mercer 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
889cd93a-2cba-4dc7-bffe-f49e67793578	public	global	work	60.00	Gallup 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
d751d46e-5575-4733-babd-64a7d3109e30	public	turkey	overall	51.00	WTW 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
75007b97-f13d-43e7-898d-0382badfd02c	public	turkey	physical	53.00	WTW 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
8cabbe4b-d168-450c-bc4c-f6efb9099fa1	public	turkey	mental	46.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
9f5c0718-007f-48cf-8e6f-59a2ad044065	public	turkey	social	60.00	WTW 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
099a4979-e33a-44c9-b5b1-02f9512695e7	public	turkey	financial	43.00	WTW 2024	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
f99069dd-28cf-41ce-9c93-214f3dd69d20	public	turkey	work	55.00	Moodivation 2025	2024	t	\N	2026-05-04 00:58:45.767783	2026-05-04 00:58:45.767783
\.


--
-- Data for Name: invitations; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.invitations (id, user_id, company_id, token, type, expires_at, used_at, created_at) FROM stdin;
6b0a0852-3ce6-42fa-9e61-ba7cad6c7f7a	40245aa3-35ab-45b1-a8c1-bf119e9c032c	\N	788efaa4-33ac-4454-95b1-db260646ca72	password_reset	2026-04-28 15:49:13.915+03	\N	2026-04-28 14:49:13.917744+03
26d2b751-4af3-405e-99ef-e7d66192cc09	581a1ca7-8c54-4bc1-98f8-5498019fa891	432402c8-2ad5-44ae-bc36-d919ee9956e7	93e6c74f-d5ad-4924-a587-61b82d46bdb5	hr_invite	2026-05-04 13:44:28.196+03	2026-05-01 13:44:28.248+03	2026-05-01 13:44:28.196568+03
569d966a-8016-4b87-a6b9-8c84eb9b1c1b	581a1ca7-8c54-4bc1-98f8-5498019fa891	432402c8-2ad5-44ae-bc36-d919ee9956e7	d4120a24-09ae-4326-bae4-bd3e96e6a061	hr_invite	2026-05-04 13:44:28.251+03	\N	2026-05-01 13:44:28.251564+03
1e7caa70-3adb-4f5d-8030-5e49f61fb800	79c0d7dc-b452-4460-beaf-d9ff7564eec9	\N	5ec5327a-8ff6-47af-b8be-f86720521b45	consultant_invite	2026-05-04 14:14:48.656+03	\N	2026-05-01 14:14:48.656753+03
d6770184-0dbb-4828-b91a-6d04939699a6	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	6d5a91871e51e177142141fedcb5a960b2df9e9ca443b436c10ba834364fbe40de0437c1befd9e189efb84d8bf5df091bda0c9aad1342a90d9c5dc1ed1819762	hr_invite	2026-05-04 13:46:40.765+03	2026-05-03 13:49:08.747+03	2026-05-03 13:46:40.750872+03
af2f5a9f-f09d-49ac-baae-a1b65fea1bc4	8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	e322aac3-2f80-4d6c-8254-07ed67de0427	employee_invite	2026-05-06 15:44:37.766+03	\N	2026-05-03 15:44:37.770176+03
\.


--
-- Data for Name: mail_templates; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.mail_templates (id, slug, subject_tr, subject_en, body_tr, body_en, variables, description, is_active, updated_at, updated_by) FROM stdin;
cfeece2f-e536-4cba-888c-4e53133020f2	welcome_hr	Wellbeing Platformuna Hoş Geldiniz	Welcome to Wellbeing Platform	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Hoş Geldin, {{hr_name}}!</h2><p>{{company_name}} için HR Admin olarak davet edildiniz. Hesabınızı oluşturarak şirketinizin wellbeing yolculuğunu başlatabilirsiniz.</p><div class="cta-container"><a href="{{invite_link}}" class="cta-button">Hesabımı Oluştur →</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Welcome, {{hr_name}}!</h2><p>You have been invited as an HR Admin for {{company_name}}. Create your account to start your company's wellbeing journey.</p><div class="cta-container"><a href="{{invite_link}}" class="cta-button">Create My Account →</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{hr_name}}", "{{company_name}}", "{{invite_link}}"]	HR Admin davet mesajı	t	2026-04-28 13:06:39.311853+03	\N
9d4d6cd8-a565-4570-b7ff-24d1a6aa04ad	password_reset	Şifre Sıfırlama Talebi	Password Reset Request	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Şifrenizi mi Unuttunuz?</h2><p>Merhaba {{user_name}}, şifrenizi sıfırlamak için aşağıdaki butonu kullanabilirsiniz. Bu link {{expires_in}} boyunca geçerlidir.</p><div class="cta-container"><a href="{{reset_link}}" class="cta-button">Şifremi Sıfırla</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Forgot Your Password?</h2><p>Hello {{user_name}}, use the button below to reset your password. This link is valid for {{expires_in}}.</p><div class="cta-container"><a href="{{reset_link}}" class="cta-button">Reset Password</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{user_name}}", "{{reset_link}}", "{{expires_in}}"]	Şifre sıfırlama linki	t	2026-04-28 13:06:39.311853+03	\N
760f19dc-f316-49f3-bd56-19e938c37198	survey_token_invite	🌱 Wellbeing Anketiniz Hazır	🌱 Your Wellbeing Survey is Ready	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Anketiniz Sizi Bekliyor!</h2><p>Merhaba {{full_name}}, {{company_name}} tarafından düzenlenen <b>{{survey_title}}</b> anketi için katılımınız bekleniyor. Görüşleriniz tamamen anonimdir.</p><p>Son katılım: {{due_date}}</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Ankete Başla →</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Your Survey is Waiting!</h2><p>Hello {{full_name}}, your participation is requested for the <b>{{survey_title}}</b> survey organized by {{company_name}}. Your feedback is completely anonymous.</p><p>Due date: {{due_date}}</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Start Survey →</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{full_name}}", "{{company_name}}", "{{survey_title}}", "{{survey_link}}", "{{due_date}}"]	Bireysel anket davetiyesi	t	2026-04-28 13:06:39.311853+03	\N
c57d86ea-f9ea-4fdb-8781-c9063c9cf96a	employee_invite	Wellbeing Hesabınızı Oluşturun	Create Your Wellbeing Account	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Ekibimize Hoş Geldiniz!</h2><p>Merhaba {{full_name}}, {{company_name}} wellbeing platformuna erişiminiz tanımlandı. Aşağıdaki butona tıklayarak kaydınızı tamamlayabilirsiniz.</p><div class="cta-container"><a href="{{invite_link}}" class="cta-button">Kayıt Ol</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Welcome to the Team!</h2><p>Hello {{full_name}}, your access to the {{company_name}} wellbeing platform has been defined. Click the button below to complete your registration.</p><div class="cta-container"><a href="{{invite_link}}" class="cta-button">Sign Up</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{full_name}}", "{{company_name}}", "{{invite_link}}"]	Çalışan kayıt davetiyesi	t	2026-04-28 13:06:39.311853+03	\N
32419d7f-79e7-4f95-88b9-96404c354de7	campaign_invite	📋 Yeni Bir Araştırma Başladı	📋 A New Research Has Started	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Görüşleriniz Bizim İçin Önemli</h2><p>Merhaba {{full_name}}, şirketimizde <b>{{survey_title}}</b> araştırması başladı. Lütfen linke tıklayarak katılım sağlayın.</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Katıl</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Your Feedback is Important</h2><p>Hello {{full_name}}, the <b>{{survey_title}}</b> research has started in our company. Please click the link to participate.</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Participate</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{full_name}}", "{{company_name}}", "{{survey_title}}", "{{survey_link}}"]	Kampanya bazlı anket daveti	t	2026-04-28 13:06:39.311853+03	\N
c58d29e8-310f-4d59-9e87-e9d14deeb46a	campaign_reminder	⏰ Hatırlatma: Anketinizi Tamamlayın	⏰ Reminder: Complete Your Survey	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Az Kaldı!</h2><p>Merhaba {{full_name}}, <b>{{survey_title}}</b> anketini tamamlamanız için son {{days_remaining}} gün. Henüz vaktiniz varken görüşlerinizi bildirmeyi unutmayın.</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Anketi Tamamla</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Almost There!</h2><p>Hello {{full_name}}, there are only {{days_remaining}} days left to complete the <b>{{survey_title}}</b> survey. Don't forget to submit your feedback while you still have time.</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Complete Survey</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{full_name}}", "{{survey_title}}", "{{survey_link}}", "{{days_remaining}}"]	Kampanya hatırlatma mesajı	t	2026-04-28 13:06:39.311853+03	\N
7ed92492-4500-4061-83a0-577915138a67	survey_reminder	⏰ Anketinizi Tamamlamayı Unutmayın	⏰ Don't Forget to Complete Your Survey	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Görüşleriniz Değerlidir</h2><p>Merhaba {{full_name}}, devam eden <b>{{survey_title}}</b> anketiniz için son {{days_remaining}} gün. Katılımınız için şimdiden teşekkürler.</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Hemen Tamamla</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Your Opinion Matters</h2><p>Hello {{full_name}}, there are {{days_remaining}} days left for your ongoing <b>{{survey_title}}</b> survey. Thank you for your participation.</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Complete Now</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{full_name}}", "{{survey_title}}", "{{survey_link}}", "{{days_remaining}}"]	Genel anket hatırlatması	t	2026-04-28 13:06:39.311853+03	\N
b598b8a5-96ab-4819-a64f-a13b1e670e1c	survey_closed	📊 Wellbeing Sonuçları Hazır	📊 Wellbeing Results are Ready	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Analizler Tamamlandı</h2><p>Sayın {{hr_name}}, {{company_name}} için <b>{{period}}</b> dönemi wellbeing araştırması sona erdi. %{{participation_rate}} katılım oranı ile elde edilen sonuçları dashboard üzerinden inceleyebilirsiniz.</p><div class="cta-container"><a href="{{dashboard_link}}" class="cta-button">Sonuçları Gör</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Analysis Completed</h2><p>Dear {{hr_name}}, the wellbeing research for <b>{{period}}</b> at {{company_name}} has ended. You can review the results obtained with a {{participation_rate}}% participation rate on the dashboard.</p><div class="cta-container"><a href="{{dashboard_link}}" class="cta-button">View Results</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{hr_name}}", "{{company_name}}", "{{period}}", "{{participation_rate}}", "{{dashboard_link}}"]	Anket kapanış ve rapor hazır bildirimi	t	2026-04-28 13:06:39.311853+03	\N
b4a37888-395b-4a20-a564-eae4344fc5d2	score_alert	⚠️ Düşük Wellbeing Skoru Uyarısı	⚠️ Low Wellbeing Score Alert	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Dikkat Gereken Alan Tespit Edildi</h2><p>Sayın {{hr_name}}, son araştırmada <b>{{dimension}}</b> boyutu skoru <b>{{score}}</b> olarak ölçülmüştür (Önceki: {{previous_score}}). Bu alanda aksiyon almanız önerilir.</p><div class="cta-container"><a href="{{dashboard_link}}" class="cta-button">Detayları İncele</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Area Requiring Attention Detected</h2><p>Dear {{hr_name}}, the <b>{{dimension}}</b> dimension score in the latest research was measured as <b>{{score}}</b> (Previous: {{previous_score}}). Taking action in this area is recommended.</p><div class="cta-container"><a href="{{dashboard_link}}" class="cta-button">Review Details</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{hr_name}}", "{{dimension}}", "{{score}}", "{{previous_score}}", "{{dashboard_link}}"]	Skor eşiği uyarısı	t	2026-04-28 13:06:39.311853+03	\N
4e38b309-bfca-453a-9c1f-8d8e918227b9	ai_ready	🤖 AI Analizi Hazır	🤖 AI Analysis is Ready	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Yapay Zeka Raporu Hazır</h2><p>Sayın {{hr_name}}, <b>{{period}}</b> dönemi için açık uçlu yanıtlar yapay zeka tarafından analiz edildi. Stratejik önerileri panelinizde bulabilirsiniz.</p><div class="cta-container"><a href="{{dashboard_link}}" class="cta-button">Analizi Oku</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>AI Report is Ready</h2><p>Dear {{hr_name}}, the open-ended responses for <b>{{period}}</b> have been analyzed by AI. You can find strategic suggestions in your panel.</p><div class="cta-container"><a href="{{dashboard_link}}" class="cta-button">Read Analysis</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{hr_name}}", "{{period}}", "{{dashboard_link}}"]	AI analizi tamamlandı bildirimi	t	2026-04-28 13:06:39.311853+03	\N
c5579707-2df9-44e9-843d-bf464e2cc8b9	plan_expiry	⚠️ Aboneliğiniz Sona Ermek Üzere	⚠️ Your Subscription is About to Expire	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Abonelik Uyarısı</h2><p>{{company_name}} için mevcut <b>{{plan_name}}</b> paketinizin süresi {{days_remaining}} gün içinde dolacaktır. Hizmet kesintisi yaşamamak için lütfen yenileyin.</p><div class="cta-container"><a href="{{platform_url}}/settings/billing" class="cta-button">Şimdi Yenile</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Subscription Warning</h2><p>Your current <b>{{plan_name}}</b> package for {{company_name}} will expire in {{days_remaining}} days. Please renew to avoid service interruption.</p><div class="cta-container"><a href="{{platform_url}}/settings/billing" class="cta-button">Renew Now</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{company_name}}", "{{days_remaining}}", "{{plan_name}}"]	Plan bitiş uyarısı	t	2026-04-28 13:06:39.311853+03	\N
d3dd1fdc-dc9c-45f8-b85d-6698763fdbf8	report_ready	📑 Raporunuz İndirilmeye Hazır	📑 Your Report is Ready for Download	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Rapor Hazır</h2><p>Sayın {{hr_name}}, <b>{{period}}</b> dönemi için talep ettiğiniz <b>{{format}}</b> formatındaki rapor oluşturuldu.</p><div class="cta-container"><a href="{{download_link}}" class="cta-button">Raporu İndir</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Report Ready</h2><p>Dear {{hr_name}}, the report in <b>{{format}}</b> format you requested for <b>{{period}}</b> has been created.</p><div class="cta-container"><a href="{{download_link}}" class="cta-button">Download Report</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{hr_name}}", "{{period}}", "{{format}}", "{{download_link}}"]	İndirilebilir rapor bildirimi	t	2026-04-28 13:06:39.311853+03	\N
0ac0a41c-c866-4721-9c17-f946a559bf72	report_failed	❌ Rapor Oluşturulamadı	❌ Report Generation Failed	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Hata Oluştu</h2><p>Sayın {{hr_name}}, <b>{{period}}</b> dönemi raporu oluşturulurken teknik bir sorun yaşandı. Lütfen tekrar deneyin veya destek ekibiyle iletişime geçin.</p><div class="cta-container"><a href="mailto:{{support_email}}" class="cta-button">Yardım Al</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>An Error Occurred</h2><p>Dear {{hr_name}}, a technical problem occurred while generating the <b>{{period}}</b> report. Please try again or contact the support team.</p><div class="cta-container"><a href="mailto:{{support_email}}" class="cta-button">Get Help</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{hr_name}}", "{{period}}", "{{format}}", "{{support_email}}"]	Rapor hata bildirimi	t	2026-04-28 13:06:39.311853+03	\N
053e192a-8135-4b48-9f98-f73bc939c842	draft_reminder	📝 Yarım Kalan Anketiniz Sizi Bekliyor	📝 Your Incomplete Survey is Waiting	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Nerede Kalmıştık?</h2><p>Merhaba {{full_name}}, <b>{{survey_title}}</b> anketine başladınız ancak henüz bitirmediniz. Kaldığınız yerden devam ederek sonuca ulaşabilirsiniz.</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Devam Et</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Where Were We?</h2><p>Hello {{full_name}}, you started the <b>{{survey_title}}</b> survey but haven't finished yet. You can continue from where you left off.</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Continue</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{full_name}}", "{{survey_title}}", "{{survey_link}}", "{{due_date}}"]	Taslak anket hatırlatması	t	2026-04-28 13:06:39.311853+03	\N
f6a4d308-3b72-47c7-b22d-7fe14631bd8d	campaign_bounced	⚠️ Teslim Edilemeyen Mailler	⚠️ Undelivered Emails	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Teslimat Sorunu</h2><p>Sayın {{hr_name}}, son kampanyada <b>{{bounced_count}}</b> adet mail alıcıya ulaşılamadığı için geri döndü. Lütfen mail adreslerini kontrol edin.</p><div class="cta-container"><a href="{{dashboard_link}}" class="cta-button">Listeyi Gör</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Delivery Issue</h2><p>Dear {{hr_name}}, in the latest campaign, <b>{{bounced_count}}</b> emails bounced back because they could not reach the recipient. Please check the email addresses.</p><div class="cta-container"><a href="{{dashboard_link}}" class="cta-button">View List</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{hr_name}}", "{{bounced_count}}", "{{dashboard_link}}"]	Hatalı mail uyarısı	t	2026-04-28 13:06:39.311853+03	\N
01ccab22-bd9a-43a4-9087-9aa616963437	consultant_invite	Eğitmen Hesabınızı Oluşturun	Create Your Consultant Account	<html><body><h2>Merhaba {{full_name}},</h2><p>Wellbeing Metric platformuna Eğitmen olarak davet edildiniz. Hesabınızı aktifleştirmek ve şifrenizi belirlemek için aşağıdaki bağlantıya tıklayabilirsiniz:</p><p><a href="{{invite_link}}" style="background:#2563eb;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Hesabımı Aktifleştir</a></p><p>Bu bağlantı {{expires_in}} boyunca geçerlidir.</p><br><p>İyi çalışmalar,<br>Wellbeing Metric Ekibi</p></body></html>	<html><body><h2>Hello {{full_name}},</h2><p>You have been invited to Wellbeing Metric as a Consultant. Click the link below to activate your account and set your password:</p><p><a href="{{invite_link}}" style="background:#2563eb;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Activate My Account</a></p><p>This link is valid for {{expires_in}}.</p><br><p>Best regards,<br>Wellbeing Metric Team</p></body></html>	["full_name", "invite_link", "expires_in"]	Eğitmen davet e-postası	t	2026-04-30 15:38:02.809704+03	\N
\.


--
-- Data for Name: onboarding_assignments; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.onboarding_assignments (id, company_id, user_id, survey_token_id, wave_number, scheduled_at, sent_at, completed_at, status, created_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.payments (id, consultant_id, subscription_id, amount, currency, status, provider, provider_payment_id, invoice_url, metadata, created_at, package_key) FROM stdin;
4ae8669f-33b4-491b-bf15-679249347462	79c0d7dc-b452-4460-beaf-d9ff7564eec9	\N	799.00	TRY	completed	stripe	\N	https://example.com/invoice.pdf	\N	2026-04-29 17:35:43.608827	\N
\.


--
-- Data for Name: platform_settings; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.platform_settings (id, ai_provider_default, ai_model_default, ai_task_models, ai_max_tokens, ai_temperature, ai_enabled, mail_provider, mail_from_address, mail_from_name, storage_provider, platform_name, platform_url, supported_languages, default_language, anonymity_threshold, score_alert_threshold, api_keys, updated_at, updated_by, mail_config, storage_config, admin_email, consultant_packages) FROM stdin;
b9be97ec-cc0d-400f-bcd2-309d9e9ec336	anthropic	claude-opus-4-5	{"hr_chat": {"model": "claude-opus-4-5", "provider": "anthropic"}, "risk_alert": {"model": "gpt-4o", "provider": "openai"}, "admin_anomaly": {"model": "gpt-4o", "provider": "openai"}, "trend_analysis": {"model": "gemini-2.0-flash", "provider": "google"}, "action_suggestion": {"model": "claude-sonnet-4-5", "provider": "anthropic"}, "open_text_summary": {"model": "claude-opus-4-5", "provider": "anthropic"}}	2000	0.3	t	resend	no-reply@mg.wellbeingmetric.com	Wellbeing Metric	cloudflare_r2	Wellbeing PlatformuWellbeing Platformu 1!	http://localhost:3000	["tr", "en"]	tr	5	45	{}	2026-05-01 12:13:10.442114+03	40245aa3-35ab-45b1-a8c1-bf119e9c032c	{"provider_specific": {"resend": {"api_key": "8350381dca5e82518c918848df769bfd:a8a888e45cb39a21566e781316628509c6bf8d973a4349d07eec5507dee5074d100b1fd6eefc926edc47ae8d39f2bb36"}}}	{}	\N	{"growth": {"label_en": "Growth", "label_tr": "Growth", "ai_enabled": true, "white_label": false, "max_companies": 20, "max_employees": 500, "description_en": "Up to 20 companies, full AI", "description_tr": "20 firmaya kadar, tam AI"}, "starter": {"label_en": "Starter", "label_tr": "Starter", "ai_enabled": false, "white_label": false, "max_companies": 5, "max_employees": 100, "description_en": "Up to 5 companies, no AI", "description_tr": "5 firmaya kadar, AI yok"}, "enterprise": {"label_en": "Enterprise", "label_tr": "Enterprise", "ai_enabled": true, "white_label": true, "max_companies": null, "max_employees": null, "description_en": "Unlimited + white-label", "description_tr": "Sınırsız firma + white-label"}}
\.


--
-- Data for Name: product_packages; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.product_packages (key, type, label_tr, label_en, description_tr, description_en, price_monthly, price_yearly, currency, credits, max_companies, max_employees, ai_enabled, white_label, sort_order, is_active, created_at, updated_at, is_visible) FROM stdin;
credit_small	credit	1.000 AI Kredisi	1,000 AI Credits	\N	\N	99.00	\N	TRY	{"ai_credit": 1000}	\N	\N	f	f	10	t	2026-04-30 17:29:42.932057	2026-04-30 17:29:42.932057	t
credit_medium	credit	5.000 AI Kredisi	5,000 AI Credits	\N	\N	399.00	\N	TRY	{"ai_credit": 5000}	\N	\N	f	f	11	t	2026-04-30 17:29:42.932057	2026-04-30 17:29:42.932057	t
credit_large	credit	10.000 AI Kredisi	10,000 AI Credits	\N	\N	699.00	\N	TRY	{"ai_credit": 10000}	\N	\N	f	f	12	t	2026-04-30 17:29:42.932057	2026-04-30 17:29:42.932057	t
growth_yearly	subscription	Growth	Growth Yearly	\N	\N	\N	7990.00	TRY	{"ai_credit": 5000, "mail_credit": 25000}	20	500	t	f	4	t	2026-04-30 17:14:13.089583	2026-04-30 17:14:13.089583	t
starter_yearly	subscription	Starter	Starter Yearly	\N	\N	\N	2990.00	TRY	{"ai_credit": 1000, "mail_credit": 5000}	5	100	f	f	2	t	2026-04-30 17:14:13.089583	2026-04-30 17:14:13.089583	t
enterprise_yearly	subscription	Enterprise	Enterprise Yearly	\N	\N	\N	19990.00	TRY	{"ai_credit": -1, "mail_credit": -1}	\N	\N	t	t	6	t	2026-04-30 17:14:13.089583	2026-04-30 17:14:13.089583	t
starter_monthly	subscription	Starter	Starter Monthly	\N	\N	299.00	\N	TRY	{"ai_credit": 1000, "mail_credit": 5000}	5	100	f	f	1	t	2026-04-30 17:14:13.089583	2026-04-30 17:14:13.089583	t
growth_monthly	subscription	Growth	Growth Monthly	\N	\N	799.00	\N	TRY	{"ai_credit": 5000, "mail_credit": 25000}	20	500	t	f	3	t	2026-04-30 17:14:13.089583	2026-04-30 17:14:13.089583	t
enterprise_monthly	subscription	Enterprise	Enterprise Monthly	\N	\N	1999.00	\N	TRY	{"ai_credit": -1, "mail_credit": -1}	\N	\N	t	t	5	t	2026-04-30 17:14:13.089583	2026-04-30 17:14:13.089583	t
\.


--
-- Data for Name: response_answer_selections; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.response_answer_selections (id, response_id, question_id, option_id, rank_order) FROM stdin;
\.


--
-- Data for Name: response_answers; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.response_answers (id, response_id, question_id, answer_value, answer_text, score, answer_row_id, answer_option_id, dimension, answer_number) FROM stdin;
87b8ba06-6b4d-43f7-850a-059d331196ca	55d11947-7403-4887-b5f3-475c41cce13b	bbd6af2f-1b9b-46d5-b9ef-1db7b2d42742	4	\N	80.00	\N	\N	mental	\N
d063ba3b-c95a-464e-9138-99967d67a24e	55d11947-7403-4887-b5f3-475c41cce13b	8f4e491c-9fbc-44fe-9b0c-9c0fea76f573	2	\N	40.00	\N	\N	social	\N
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.subscriptions (id, consultant_id, package_key, status, "interval", current_period_start, current_period_end, cancel_at_period_end, provider, provider_subscription_id, created_at, updated_at) FROM stdin;
c50aa9a7-45d1-4858-8c7a-ebe7250c176a	79c0d7dc-b452-4460-beaf-d9ff7564eec9	growth_monthly	active	monthly	2026-04-30 17:35:22.369911	2026-05-30 17:35:22.369911	f	\N	\N	2026-04-30 17:35:22.369911	2026-04-30 17:35:22.369911
755ab520-647a-4535-b022-5d653af2f950	79c0d7dc-b452-4460-beaf-d9ff7564eec9	growth_monthly	active	monthly	2026-04-30 17:35:43.558023	2026-05-30 17:35:43.558023	f	\N	\N	2026-04-30 17:35:43.558023	2026-04-30 17:35:43.558023
\.


--
-- Data for Name: survey_assignments; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.survey_assignments (id, survey_id, company_id, assigned_at, due_at, status, assigned_by, period, department_id) FROM stdin;
\.


--
-- Data for Name: survey_drafts; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.survey_drafts (id, created_by, title, draft_data, last_saved_at, created_at) FROM stdin;
\.


--
-- Data for Name: survey_question_options; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.survey_question_options (id, question_id, order_index, label_tr, label_en, value) FROM stdin;
\.


--
-- Data for Name: survey_question_rows; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.survey_question_rows (id, question_id, order_index, is_reversed, weight, label_tr, label_en, dimension) FROM stdin;
\.


--
-- Data for Name: survey_questions; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.survey_questions (id, survey_id, question_text_tr, question_text_en, is_reversed, weight, order_index, is_required, is_active, number_min, number_max, number_step, created_at, updated_at, dimension, question_type, matrix_label_tr, matrix_label_en) FROM stdin;
ce2e1d9b-b4a0-42c8-b06e-ba5c7a761abe	6a56f70f-b775-4eef-832a-27ae1e5fb7fa	Stres seviyemi yönetilebilir buluyorum.	I find my stress level manageable.	f	1.00	0	t	t	\N	\N	\N	2026-05-03 20:46:16.861526+03	2026-05-03 20:46:16.861526+03	mental	likert5	\N	\N
ade2ff22-0fab-4d4c-8874-fc0968fdc865	6a56f70f-b775-4eef-832a-27ae1e5fb7fa	Ekip arkadaşlarımla iletişimim güçlüdür.	\N	f	1.00	1	t	t	\N	\N	\N	2026-05-03 20:46:16.861526+03	2026-05-03 20:46:16.861526+03	social	likert5	\N	\N
9731b4f0-d233-4d27-a786-26e111d2fd2f	6a56f70f-b775-4eef-832a-27ae1e5fb7fa	Genel olarak işyeri memnuniyetim yüksektir.	\N	f	1.00	2	t	t	\N	\N	\N	2026-05-03 20:46:16.861526+03	2026-05-03 20:46:16.861526+03	overall	likert5	\N	\N
0b4113a1-0d3b-4247-9c2f-67649b0ad275	6a56f70f-b775-4eef-832a-27ae1e5fb7fa	Stres seviyemi yönetilebilir buluyorum.	I find my stress level manageable.	f	1.00	0	t	t	\N	\N	\N	2026-05-03 20:46:16.882417+03	2026-05-03 20:46:16.882417+03	mental	likert5	\N	\N
b02ff049-e095-4787-8086-9134b794cd4d	6a56f70f-b775-4eef-832a-27ae1e5fb7fa	Ekip arkadaşlarımla iletişimim güçlüdür.	\N	f	1.00	1	t	t	\N	\N	\N	2026-05-03 20:46:16.882417+03	2026-05-03 20:46:16.882417+03	social	likert5	\N	\N
f040269c-f529-418b-8375-090bfd3ee199	6a56f70f-b775-4eef-832a-27ae1e5fb7fa	Genel olarak işyeri memnuniyetim yüksektir.	\N	f	1.00	2	t	t	\N	\N	\N	2026-05-03 20:46:16.882417+03	2026-05-03 20:46:16.882417+03	overall	likert5	\N	\N
158f890a-56f9-411c-a4bb-7d3d0838eac0	d56718b8-72f5-453d-b5c9-67d40e53b094	Stres seviyemi yönetilebilir buluyorum.	\N	f	1.00	0	t	t	\N	\N	\N	2026-05-03 20:48:02.31907+03	2026-05-03 20:48:02.31907+03	mental	likert5	\N	\N
9a5bb572-ebac-47e2-b968-0e07b0fc7ca1	d56718b8-72f5-453d-b5c9-67d40e53b094	Genel memnuniyetim yüksektir.	\N	f	1.00	1	t	t	\N	\N	\N	2026-05-03 20:48:02.31907+03	2026-05-03 20:48:02.31907+03	overall	likert5	\N	\N
bbd6af2f-1b9b-46d5-b9ef-1db7b2d42742	73f06599-8dcb-4dbf-9167-c3b61bf79896	Genel olarak stres seviyem yönetilebilir düzeydedir.	Overall, my stress level is manageable.	f	1.00	0	t	t	\N	\N	\N	2026-05-03 20:53:13.788828+03	2026-05-03 20:53:13.788828+03	mental	likert5	\N	\N
8f4e491c-9fbc-44fe-9b0c-9c0fea76f573	73f06599-8dcb-4dbf-9167-c3b61bf79896	Ekip arkadaşlarımla iletişimim kuvvetlidir.	I have strong communication with my teammates.	f	1.00	1	t	t	\N	\N	\N	2026-05-03 20:53:13.788828+03	2026-05-03 20:53:13.788828+03	social	likert5	\N	\N
\.


--
-- Data for Name: survey_responses; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.survey_responses (id, survey_id, assignment_id, user_id, company_id, department_id, tenure_months, is_anonymous, submitted_at, period, location, seniority, age_group, gender) FROM stdin;
55d11947-7403-4887-b5f3-475c41cce13b	73f06599-8dcb-4dbf-9167-c3b61bf79896	\N	\N	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	\N	\N	t	2026-05-03 23:44:41.749+03	2026-05	\N	\N	\N	\N
\.


--
-- Data for Name: survey_throttle; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.survey_throttle (id, user_id, survey_id, last_submitted_at) FROM stdin;
\.


--
-- Data for Name: survey_tokens; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.survey_tokens (id, survey_id, assignment_id, company_id, department_id, is_used, expires_at, created_at, due_at, metadata, token, email, full_name, language, employee_id, pin_code) FROM stdin;
6c4783c8-3efe-4e0c-a010-c631303f9562	73f06599-8dcb-4dbf-9167-c3b61bf79896	\N	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	\N	f	\N	2026-05-03 21:28:55.211593+03	\N	\N	4ecbe2c27b3239344ed75732a8643e71d9ea1e92908be47833053e8f2b2fe117	test@example.com	Test User	tr	\N	\N
731d5b70-86e6-4174-a496-dc41ff4a09f3	73f06599-8dcb-4dbf-9167-c3b61bf79896	\N	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	\N	t	\N	2026-05-03 23:25:07.942696+03	\N	{"used_at": "2026-05-03T20:44:41.757Z", "used_ip": "::1"}	61d4dac366a83ae988426e6404583ddc3141eea5ba8cf4eb20e75378e7f53053	onuroctoplus@gmail.com	Onur Ekşi	tr	410993b7-d47e-4e79-b56b-a952d2204653	\N
\.


--
-- Data for Name: surveys; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.surveys (id, company_id, title_tr, title_en, description_tr, description_en, is_anonymous, is_active, throttle_days, starts_at, ends_at, created_by, created_at, updated_at, type, frequency, is_pool_visible, pool_added_at) FROM stdin;
6a56f70f-b775-4eef-832a-27ae1e5fb7fa	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	Test Anket	Test Survey	\N	\N	t	t	7	\N	\N	79c0d7dc-b452-4460-beaf-d9ff7564eec9	2026-05-03 20:46:16.861526+03	2026-05-03 20:46:16.861526+03	company_specific	monthly	t	2026-05-03 20:46:16.858+03
d56718b8-72f5-453d-b5c9-67d40e53b094	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	Test Anket 2	\N	\N	\N	t	t	7	\N	\N	79c0d7dc-b452-4460-beaf-d9ff7564eec9	2026-05-03 20:48:02.313137+03	2026-05-03 20:48:02.313137+03	company_specific	monthly	t	2026-05-03 20:48:02.31+03
73f06599-8dcb-4dbf-9167-c3b61bf79896	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	Anket 1		\N	\N	t	t	7	\N	\N	79c0d7dc-b452-4460-beaf-d9ff7564eec9	2026-05-03 20:53:13.784951+03	2026-05-03 20:53:13.784951+03	company_specific	monthly	t	2026-05-03 20:53:13.784+03
\.


--
-- Data for Name: typeorm_migrations; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.typeorm_migrations (id, "timestamp", name) FROM stdin;
1	1745750400000	InitialSchema1745750400000
2	1745800400000	AddDueAtToSurveyTokens1745800400000
3	1745850400000	UpdatePlatformSettings1745850400000
4	1745950400000	AddMissingTables1745950400000
5	1746050400000	MailTemplates1746050400000
6	1714316000000	Industries1714316000000
7	1714318000000	DemoRequestsSurveyDrafts1714318000000
8	1714319000000	RefineDemoAndDrafts1714319000000
9	1714320000000	AddAdminEmailToSettings1714320000000
10	1714330000000	ConsultantLayer0081714330000000
11	1714335000000	ConsultantPackages0111714335000000
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.users (id, company_id, department_id, email, password_hash, full_name, role, "position", location, seniority, age_group, gender, start_date, language, is_active, last_login_at, created_at) FROM stdin;
79c0d7dc-b452-4460-beaf-d9ff7564eec9	\N	\N	onur@3bitz.com	$2a$12$ruq4rEX3y7TROqRYK8qqyugH1hvf.jaohTV/A6/rPrmDdyyyaahOa	Onur Ekşi	consultant	\N	\N	\N	\N	\N	\N	tr	t	2026-05-03 21:10:49.212+03	2026-04-30 17:27:36.406521+03
40245aa3-35ab-45b1-a8c1-bf119e9c032c	\N	\N	admin@wellanalytics.com	$2a$10$DjuhSXVgWrb5rf3LUrS98e3f368xgwG7qVpAc/uK.1EmdlDZSbrz2	Sistem Yöneticisi	super_admin	\N	\N	\N	\N	\N	\N	tr	t	2026-05-04 01:42:44.112+03	2026-04-28 13:16:15.597027+03
8a853f4f-7fea-4bb4-b2d7-1ade18e18385	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	\N	onureksi82@gmail.com	$2a$12$cdPg/5/sYQ6QAtdElnW8hOJ697XGrPJnlh1DyfZTJHRcQGSaf9y/K	\N	hr_admin	\N	\N	\N	\N	\N	\N	tr	t	2026-05-04 02:10:44.276+03	2026-05-03 13:46:40.750872+03
7dc0c7b4-7dec-49e9-afba-3460a882e560	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	5acef875-4642-4e3f-a5b3-59e3b8e69a3c	test@example.com	\N	Test User	employee	Developer	Istanbul	Senior	26-35	male	2024-01-01	tr	t	\N	2026-05-03 15:06:03.598559+03
581a1ca7-8c54-4bc1-98f8-5498019fa891	432402c8-2ad5-44ae-bc36-d919ee9956e7	\N	test_invite_v5@wellanalytics.io	\N	Test Invite V5	hr_admin	\N	\N	\N	\N	\N	\N	tr	t	\N	2026-05-01 13:44:28.183864+03
\.


--
-- Data for Name: wellbeing_scores; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.wellbeing_scores (id, company_id, score, calculated_at, response_count, period, segment_type, segment_value, dimension) FROM stdin;
9cb31652-7220-4ef6-83a6-11d1992ae7bc	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	80.00	2026-05-04 00:11:18.9038+03	1	2026-05	\N	\N	mental
76b1df43-0f6f-4758-a4ea-6fb9bb793d97	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	60.00	2026-05-04 00:11:18.9038+03	1	2026-05	\N	\N	overall
81c85abd-2e3c-4719-8182-1664cdc2f02d	5fa4cda0-c6b7-4702-acb1-9d3c1f6c88d5	40.00	2026-05-04 00:11:18.9038+03	1	2026-05	\N	\N	social
\.


--
-- Name: typeorm_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wellanalytics
--

SELECT pg_catalog.setval('public.typeorm_migrations_id_seq', 35, true);


--
-- Name: payments PK_197ab7af18c93fbb0c9b28b4a59; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY (id);


--
-- Name: credit_types PK_2968ccfd66fe1b33ed0de3511c5; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.credit_types
    ADD CONSTRAINT "PK_2968ccfd66fe1b33ed0de3511c5" PRIMARY KEY (key);


--
-- Name: product_packages PK_2b9b174f085925b24c6a9c30b85; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.product_packages
    ADD CONSTRAINT "PK_2b9b174f085925b24c6a9c30b85" PRIMARY KEY (key);


--
-- Name: industry_benchmark_scores PK_33ae74d433e61dffb8fc45d9414; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.industry_benchmark_scores
    ADD CONSTRAINT "PK_33ae74d433e61dffb8fc45d9414" PRIMARY KEY (id);


--
-- Name: onboarding_assignments PK_86ec4d3b8f870e4067830ad1b64; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.onboarding_assignments
    ADD CONSTRAINT "PK_86ec4d3b8f870e4067830ad1b64" PRIMARY KEY (id);


--
-- Name: credit_transactions PK_a408319811d1ab32832ec86fc2c; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT "PK_a408319811d1ab32832ec86fc2c" PRIMARY KEY (id);


--
-- Name: subscriptions PK_a87248d73155605cf782be9ee5e; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY (id);


--
-- Name: employees PK_b9535a98350d5b26e7eb0c26af4; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY (id);


--
-- Name: credit_balances PK_b9f1be6c9f3f23c5716fa7d8545; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.credit_balances
    ADD CONSTRAINT "PK_b9f1be6c9f3f23c5716fa7d8545" PRIMARY KEY (id);


--
-- Name: typeorm_migrations PK_bb2f075707dd300ba86d0208923; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.typeorm_migrations
    ADD CONSTRAINT "PK_bb2f075707dd300ba86d0208923" PRIMARY KEY (id);


--
-- Name: wellbeing_scores UQ_0f64edf612489ae9e23342585c6; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.wellbeing_scores
    ADD CONSTRAINT "UQ_0f64edf612489ae9e23342585c6" UNIQUE (company_id, period, segment_type, segment_value, dimension);


--
-- Name: consultant_plans UQ_8c1b78c00008cb2ccc5d6708492; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.consultant_plans
    ADD CONSTRAINT "UQ_8c1b78c00008cb2ccc5d6708492" UNIQUE (consultant_id);


--
-- Name: departments UQ_924267c09f9e6d7d8302173d41e; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT "UQ_924267c09f9e6d7d8302173d41e" UNIQUE (company_id, name);


--
-- Name: survey_tokens UQ_b8f75da156055d93190cb2586f9; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.survey_tokens
    ADD CONSTRAINT "UQ_b8f75da156055d93190cb2586f9" UNIQUE (token);


--
-- Name: credit_balances UQ_f73f59cb0ed75daff9852dbf5f0; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.credit_balances
    ADD CONSTRAINT "UQ_f73f59cb0ed75daff9852dbf5f0" UNIQUE (consultant_id, credit_type_key);


--
-- Name: actions actions_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_pkey PRIMARY KEY (id);


--
-- Name: ai_insights ai_insights_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.ai_insights
    ADD CONSTRAINT ai_insights_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: companies companies_slug_key; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_slug_key UNIQUE (slug);


--
-- Name: consultant_plans consultant_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.consultant_plans
    ADD CONSTRAINT consultant_plans_pkey PRIMARY KEY (id);


--
-- Name: content_items content_items_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT content_items_pkey PRIMARY KEY (id);


--
-- Name: demo_requests demo_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.demo_requests
    ADD CONSTRAINT demo_requests_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: distribution_campaigns distribution_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.distribution_campaigns
    ADD CONSTRAINT distribution_campaigns_pkey PRIMARY KEY (id);


--
-- Name: distribution_logs distribution_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.distribution_logs
    ADD CONSTRAINT distribution_logs_pkey PRIMARY KEY (id);


--
-- Name: draft_responses draft_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.draft_responses
    ADD CONSTRAINT draft_responses_pkey PRIMARY KEY (id);


--
-- Name: industries industries_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.industries
    ADD CONSTRAINT industries_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_token_key; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_token_key UNIQUE (token);


--
-- Name: mail_templates mail_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.mail_templates
    ADD CONSTRAINT mail_templates_pkey PRIMARY KEY (id);


--
-- Name: mail_templates mail_templates_slug_key; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.mail_templates
    ADD CONSTRAINT mail_templates_slug_key UNIQUE (slug);


--
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);


--
-- Name: response_answer_selections response_answer_selections_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.response_answer_selections
    ADD CONSTRAINT response_answer_selections_pkey PRIMARY KEY (id);


--
-- Name: response_answers response_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.response_answers
    ADD CONSTRAINT response_answers_pkey PRIMARY KEY (id);


--
-- Name: survey_assignments survey_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.survey_assignments
    ADD CONSTRAINT survey_assignments_pkey PRIMARY KEY (id);


--
-- Name: survey_drafts survey_drafts_created_by_key; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.survey_drafts
    ADD CONSTRAINT survey_drafts_created_by_key UNIQUE (created_by);


--
-- Name: survey_drafts survey_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.survey_drafts
    ADD CONSTRAINT survey_drafts_pkey PRIMARY KEY (id);


--
-- Name: survey_question_options survey_question_options_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.survey_question_options
    ADD CONSTRAINT survey_question_options_pkey PRIMARY KEY (id);


--
-- Name: survey_question_rows survey_question_rows_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.survey_question_rows
    ADD CONSTRAINT survey_question_rows_pkey PRIMARY KEY (id);


--
-- Name: survey_questions survey_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.survey_questions
    ADD CONSTRAINT survey_questions_pkey PRIMARY KEY (id);


--
-- Name: survey_responses survey_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_pkey PRIMARY KEY (id);


--
-- Name: survey_throttle survey_throttle_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.survey_throttle
    ADD CONSTRAINT survey_throttle_pkey PRIMARY KEY (id);


--
-- Name: survey_tokens survey_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.survey_tokens
    ADD CONSTRAINT survey_tokens_pkey PRIMARY KEY (id);


--
-- Name: surveys surveys_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wellbeing_scores wellbeing_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.wellbeing_scores
    ADD CONSTRAINT wellbeing_scores_pkey PRIMARY KEY (id);


--
-- Name: IDX_0f426495c3fa9854e88f7f337f; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX "IDX_0f426495c3fa9854e88f7f337f" ON public.distribution_logs USING btree (survey_token_id);


--
-- Name: IDX_4ff129e4d52b3a32e131fa21fd; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE UNIQUE INDEX "IDX_4ff129e4d52b3a32e131fa21fd" ON public.industries USING btree (slug);


--
-- Name: IDX_8c1b78c00008cb2ccc5d670849; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX "IDX_8c1b78c00008cb2ccc5d670849" ON public.consultant_plans USING btree (consultant_id);


--
-- Name: IDX_b17a00dd28d03a9f05a1e0ddec; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX "IDX_b17a00dd28d03a9f05a1e0ddec" ON public.distribution_logs USING btree (company_id);


--
-- Name: IDX_c376bdbfd3ca921f7267f9a936; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX "IDX_c376bdbfd3ca921f7267f9a936" ON public.distribution_logs USING btree (user_id);


--
-- Name: IDX_cce91ee9bc49f56c8c980df64d; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX "IDX_cce91ee9bc49f56c8c980df64d" ON public.content_items USING btree (consultant_id);


--
-- Name: IDX_d907b8f8d6deaa7bd2cfbf929d; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX "IDX_d907b8f8d6deaa7bd2cfbf929d" ON public.distribution_logs USING btree (campaign_id);


--
-- Name: IDX_f6bc74bd4d5f51b72bc866ea9a; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE UNIQUE INDEX "IDX_f6bc74bd4d5f51b72bc866ea9a" ON public.onboarding_assignments USING btree (user_id, wave_number);


--
-- Name: idx_actions_company; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX idx_actions_company ON public.actions USING btree (company_id, status);


--
-- Name: idx_audit_company; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX idx_audit_company ON public.audit_logs USING btree (company_id, created_at DESC);


--
-- Name: idx_audit_user; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX idx_audit_user ON public.audit_logs USING btree (user_id, created_at DESC);


--
-- Name: idx_content_dimension; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX idx_content_dimension ON public.content_items USING btree (dimension, score_threshold);


--
-- Name: idx_dept_company; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX idx_dept_company ON public.departments USING btree (company_id);


--
-- Name: idx_insights_company; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX idx_insights_company ON public.ai_insights USING btree (company_id, period);


--
-- Name: idx_insights_type; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX idx_insights_type ON public.ai_insights USING btree (company_id, insight_type, period);


--
-- Name: idx_inv_token; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX idx_inv_token ON public.invitations USING btree (token);


--
-- Name: idx_inv_user; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX idx_inv_user ON public.invitations USING btree (user_id);


--
-- Name: idx_users_company; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX idx_users_company ON public.users USING btree (company_id);


--
-- Name: idx_users_company_role; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX idx_users_company_role ON public.users USING btree (company_id, role);


--
-- Name: idx_users_dept; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX idx_users_dept ON public.users USING btree (department_id);


--
-- Name: companies FK_01eb57aeb716cf61f6f57b112bb; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT "FK_01eb57aeb716cf61f6f57b112bb" FOREIGN KEY (consultant_id) REFERENCES public.users(id);


--
-- Name: users FK_0921d1972cf861d568f5271cd85; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_0921d1972cf861d568f5271cd85" FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: survey_question_options FK_118b578f5a850c87bced3fbdbab; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.survey_question_options
    ADD CONSTRAINT "FK_118b578f5a850c87bced3fbdbab" FOREIGN KEY (question_id) REFERENCES public.survey_questions(id) ON DELETE CASCADE;


--
-- Name: survey_question_rows FK_1a44c98dfb5c3e012a1909c0698; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.survey_question_rows
    ADD CONSTRAINT "FK_1a44c98dfb5c3e012a1909c0698" FOREIGN KEY (question_id) REFERENCES public.survey_questions(id) ON DELETE CASCADE;


--
-- Name: content_items FK_237a7ac2f9cfcc33013eab70165; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT "FK_237a7ac2f9cfcc33013eab70165" FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: onboarding_assignments FK_30bd91f94647d608e253bb22ca5; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.onboarding_assignments
    ADD CONSTRAINT "FK_30bd91f94647d608e253bb22ca5" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: onboarding_assignments FK_352c3b3f0025896a6f29bed8d46; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.onboarding_assignments
    ADD CONSTRAINT "FK_352c3b3f0025896a6f29bed8d46" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: credit_transactions FK_3b6bd00c1af8b729c033cfdf250; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT "FK_3b6bd00c1af8b729c033cfdf250" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: response_answer_selections FK_470e3a4d62a9e874e315a43dacf; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.response_answer_selections
    ADD CONSTRAINT "FK_470e3a4d62a9e874e315a43dacf" FOREIGN KEY (response_id) REFERENCES public.survey_responses(id) ON DELETE CASCADE;


--
-- Name: distribution_campaigns FK_48c7660450ae2a9eb09d68761f7; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.distribution_campaigns
    ADD CONSTRAINT "FK_48c7660450ae2a9eb09d68761f7" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: survey_assignments FK_4b94ad4b79dc54392a512693751; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.survey_assignments
    ADD CONSTRAINT "FK_4b94ad4b79dc54392a512693751" FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON DELETE CASCADE;


--
-- Name: mail_templates FK_4fb4a557cbd6e374ffa5c7a9e35; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.mail_templates
    ADD CONSTRAINT "FK_4fb4a557cbd6e374ffa5c7a9e35" FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: actions FK_5418072da0def41a75b04c785cc; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT "FK_5418072da0def41a75b04c785cc" FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: departments FK_541e3d07c93baa9cc42b149a5fb; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT "FK_541e3d07c93baa9cc42b149a5fb" FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: payments FK_5fca992ffa73c488c441c9fdcf8; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_5fca992ffa73c488c441c9fdcf8" FOREIGN KEY (consultant_id) REFERENCES public.users(id);


--
-- Name: platform_settings FK_62e70f824fccd12d37b7fe11b01; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT "FK_62e70f824fccd12d37b7fe11b01" FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: employees FK_678a3540f843823784b0fe4a4f2; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT "FK_678a3540f843823784b0fe4a4f2" FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: subscriptions FK_68f0f02652b96fc5e7692c984b0; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "FK_68f0f02652b96fc5e7692c984b0" FOREIGN KEY (consultant_id) REFERENCES public.users(id);


--
-- Name: actions FK_734455009af8a75d3738d367893; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT "FK_734455009af8a75d3738d367893" FOREIGN KEY (content_item_id) REFERENCES public.content_items(id);


--
-- Name: payments FK_75848dfef07fd19027e08ca81d2; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_75848dfef07fd19027e08ca81d2" FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id);


--
-- Name: distribution_campaigns FK_770cd9bbffaf1a63b8949f43f3e; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.distribution_campaigns
    ADD CONSTRAINT "FK_770cd9bbffaf1a63b8949f43f3e" FOREIGN KEY (survey_id) REFERENCES public.surveys(id);


--
-- Name: credit_transactions FK_785e391145c66230d5745d83100; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT "FK_785e391145c66230d5745d83100" FOREIGN KEY (credit_type_key) REFERENCES public.credit_types(key);


--
-- Name: users FK_7ae6334059289559722437bcc1c; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_7ae6334059289559722437bcc1c" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: employees FK_7f3eeef59eece4147effe7bfa6a; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT "FK_7f3eeef59eece4147effe7bfa6a" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: credit_balances FK_80de847cffbc76d6102936304a9; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.credit_balances
    ADD CONSTRAINT "FK_80de847cffbc76d6102936304a9" FOREIGN KEY (consultant_id) REFERENCES public.users(id);


--
-- Name: ai_insights FK_83ff251ff4d6aa15ac887c9323e; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.ai_insights
    ADD CONSTRAINT "FK_83ff251ff4d6aa15ac887c9323e" FOREIGN KEY (survey_id) REFERENCES public.surveys(id);


--
-- Name: actions FK_87f47bca7c648f57c8b32d7eb8e; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT "FK_87f47bca7c648f57c8b32d7eb8e" FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: survey_questions FK_895ad6ec351b200c52c8d1ec099; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.survey_questions
    ADD CONSTRAINT "FK_895ad6ec351b200c52c8d1ec099" FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON DELETE CASCADE;


--
-- Name: consultant_plans FK_8c1b78c00008cb2ccc5d6708492; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.consultant_plans
    ADD CONSTRAINT "FK_8c1b78c00008cb2ccc5d6708492" FOREIGN KEY (consultant_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ai_insights FK_9541c264c3a72f7aba5649721eb; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.ai_insights
    ADD CONSTRAINT "FK_9541c264c3a72f7aba5649721eb" FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: response_answers FK_9556dcba71bb5a3bccd76570230; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.response_answers
    ADD CONSTRAINT "FK_9556dcba71bb5a3bccd76570230" FOREIGN KEY (response_id) REFERENCES public.survey_responses(id) ON DELETE CASCADE;


--
-- Name: surveys FK_99903dc9334d040211a4ed793e3; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT "FK_99903dc9334d040211a4ed793e3" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: demo_requests FK_9dbd2d99cd4b7b70ef1661683f7; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.demo_requests
    ADD CONSTRAINT "FK_9dbd2d99cd4b7b70ef1661683f7" FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: actions FK_a270868c44163579b717aa5ec6e; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT "FK_a270868c44163579b717aa5ec6e" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: subscriptions FK_a45d5206942cb1873cec2902e53; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "FK_a45d5206942cb1873cec2902e53" FOREIGN KEY (package_key) REFERENCES public.product_packages(key);


--
-- Name: credit_transactions FK_a8d7a73013307ce2c4c87874524; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT "FK_a8d7a73013307ce2c4c87874524" FOREIGN KEY (consultant_id) REFERENCES public.users(id);


--
-- Name: surveys FK_b395d649c64d92997cb33f4d572; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT "FK_b395d649c64d92997cb33f4d572" FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: audit_logs FK_bd2726fd31b35443f2245b93ba0; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: distribution_logs FK_d907b8f8d6deaa7bd2cfbf929dc; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.distribution_logs
    ADD CONSTRAINT "FK_d907b8f8d6deaa7bd2cfbf929dc" FOREIGN KEY (campaign_id) REFERENCES public.distribution_campaigns(id);


--
-- Name: survey_tokens FK_dd0036a9d969e11de224eaef704; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.survey_tokens
    ADD CONSTRAINT "FK_dd0036a9d969e11de224eaef704" FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON DELETE CASCADE;


--
-- Name: onboarding_assignments FK_e07ea1c2ae1150df743f1c3f75c; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.onboarding_assignments
    ADD CONSTRAINT "FK_e07ea1c2ae1150df743f1c3f75c" FOREIGN KEY (survey_token_id) REFERENCES public.survey_tokens(id);


--
-- Name: credit_balances FK_efb7a0ec0bcba25937c16dccc03; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.credit_balances
    ADD CONSTRAINT "FK_efb7a0ec0bcba25937c16dccc03" FOREIGN KEY (credit_type_key) REFERENCES public.credit_types(key);


--
-- Name: ai_insights FK_fd393e8ecd4a31416f5560e2c71; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.ai_insights
    ADD CONSTRAINT "FK_fd393e8ecd4a31416f5560e2c71" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: invitations FK_fecdffec754fa4d5cea98709776; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT "FK_fecdffec754fa4d5cea98709776" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: wellanalytics
--

GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict L1mHM8hrWxujKOA7FbZJ5IDc29VSg4wsd6p5axeiBPFZ7rFdJa6SOBrwhZsNnnq

