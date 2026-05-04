--
-- PostgreSQL database dump
--

\restrict jrq2lejAGvnQwoCLE8ekoH7cKYwhtnz5LZPsv1xo7Y9lFZ5crTGPRoVzF1uDeZG

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
    created_at timestamp with time zone DEFAULT now() NOT NULL
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
    created_at timestamp without time zone DEFAULT now() NOT NULL
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
    period character varying(7) NOT NULL
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
    language character varying DEFAULT 'tr'::character varying NOT NULL
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
    frequency character varying(50)
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
\.


--
-- Data for Name: ai_insights; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.ai_insights (id, company_id, department_id, survey_id, period, insight_type, content, metadata, generated_at) FROM stdin;
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
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.companies (id, name, slug, industry, size_band, plan, plan_expires_at, is_active, contact_email, logo_url, settings, created_at, created_by, consultant_id) FROM stdin;
77777777-7777-7777-7777-777777777777	Cerrahi Test Co	cerrahi-test	\N	\N	pro	\N	t	contact@cerrahi.com	\N	{}	2026-05-01 13:44:15.098167+03	\N	\N
432402c8-2ad5-44ae-bc36-d919ee9956e7	Real UUID Co	real-432402c8	\N	\N	pro	\N	t	c@c.com	\N	{}	2026-05-01 13:44:28.171295+03	\N	\N
\.


--
-- Data for Name: consultant_plans; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.consultant_plans (id, consultant_id, plan, max_companies, max_employees, ai_enabled, white_label, custom_domain, valid_until, is_active, created_at) FROM stdin;
bf586495-082d-4d2d-b669-0a528c3a8252	962dc6e8-b61e-4992-a7b9-4c4d797c2277	starter	5	100	f	f	\N	\N	t	2026-05-01 11:50:42.380448+03
\.


--
-- Data for Name: content_items; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.content_items (id, title_tr, title_en, description_tr, description_en, type, dimension, url_tr, url_en, score_threshold, is_active, created_by, created_at, consultant_id) FROM stdin;
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
\.


--
-- Data for Name: distribution_campaigns; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.distribution_campaigns (id, company_id, survey_id, total_recipients, sent_count, delivered_count, opened_count, clicked_count, completed_count, assignment_id, period, created_by, trigger_type, scheduled_at, sent_at, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: distribution_logs; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.distribution_logs (id, campaign_id, company_id, full_name, user_id, mail_provider_id, bounce_reason, retry_count, email, survey_token_id, status, sent_at, opened_at, clicked_at, completed_at, created_at) FROM stdin;
\.


--
-- Data for Name: draft_responses; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.draft_responses (id, survey_id, user_id, token, answers, created_at, updated_at) FROM stdin;
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
-- Data for Name: invitations; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.invitations (id, user_id, company_id, token, type, expires_at, used_at, created_at) FROM stdin;
6b0a0852-3ce6-42fa-9e61-ba7cad6c7f7a	40245aa3-35ab-45b1-a8c1-bf119e9c032c	\N	788efaa4-33ac-4454-95b1-db260646ca72	password_reset	2026-04-28 15:49:13.915+03	\N	2026-04-28 14:49:13.917744+03
018c56ce-d145-4fd7-bd3e-0bfca24c0d1f	962dc6e8-b61e-4992-a7b9-4c4d797c2277	\N	ba974238f491b80297fcabbe607b2af5b51763a0ca1cf77c45fd012ef0989fd3a829966d853e2c06ae5dff137f19c31f11bb4080b276faa74d9aaa6bd9334172	consultant_invite	2026-05-03 11:50:43.114+03	2026-05-01 13:24:02.542+03	2026-05-01 11:50:42.380448+03
76d30645-fdc8-4afb-b594-972d074db484	962dc6e8-b61e-4992-a7b9-4c4d797c2277	\N	f540a9e7-bca8-4b05-b754-4370d74ae7f8	employee_invite	2026-05-04 13:24:02.545+03	2026-05-01 13:33:10.965+03	2026-05-01 13:24:02.549101+03
26d2b751-4af3-405e-99ef-e7d66192cc09	581a1ca7-8c54-4bc1-98f8-5498019fa891	432402c8-2ad5-44ae-bc36-d919ee9956e7	93e6c74f-d5ad-4924-a587-61b82d46bdb5	hr_invite	2026-05-04 13:44:28.196+03	2026-05-01 13:44:28.248+03	2026-05-01 13:44:28.196568+03
569d966a-8016-4b87-a6b9-8c84eb9b1c1b	581a1ca7-8c54-4bc1-98f8-5498019fa891	432402c8-2ad5-44ae-bc36-d919ee9956e7	d4120a24-09ae-4326-bae4-bd3e96e6a061	hr_invite	2026-05-04 13:44:28.251+03	\N	2026-05-01 13:44:28.251564+03
25c68b0c-ebb7-4c4e-aba4-fead27b86fc0	962dc6e8-b61e-4992-a7b9-4c4d797c2277	\N	5f594db6-16e1-4a10-bb2e-5f9db84cfccc	employee_invite	2026-05-04 13:33:10.967+03	2026-05-01 14:14:03.153+03	2026-05-01 13:33:10.968416+03
1e7caa70-3adb-4f5d-8030-5e49f61fb800	79c0d7dc-b452-4460-beaf-d9ff7564eec9	\N	5ec5327a-8ff6-47af-b8be-f86720521b45	consultant_invite	2026-05-04 14:14:48.656+03	\N	2026-05-01 14:14:48.656753+03
b3ce831b-3319-4881-9e89-1ae321db4908	962dc6e8-b61e-4992-a7b9-4c4d797c2277	\N	7b00ed70-fb04-4f79-8a8a-e0d8c840ef4c	consultant_invite	2026-05-04 14:14:03.179+03	2026-05-01 14:15:20.294+03	2026-05-01 14:14:03.186424+03
91fad412-0ac9-4b63-bd47-8cd2b093db96	962dc6e8-b61e-4992-a7b9-4c4d797c2277	\N	6d725f94-dc10-445e-9ce6-94b234b21860	consultant_invite	2026-05-04 14:15:20.297+03	\N	2026-05-01 14:15:20.298294+03
\.


--
-- Data for Name: mail_templates; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.mail_templates (id, slug, subject_tr, subject_en, body_tr, body_en, variables, description, is_active, updated_at, updated_by) FROM stdin;
cfeece2f-e536-4cba-888c-4e53133020f2	welcome_hr	Wellbeing Platformuna Hoş Geldiniz	Welcome to Wellbeing Platform	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Hoş Geldin, {{hr_name}}!</h2><p>{{company_name}} için HR Admin olarak davet edildiniz. Hesabınızı oluşturarak şirketinizin wellbeing yolculuğunu başlatabilirsiniz.</p><div class="cta-container"><a href="{{invite_link}}" class="cta-button">Hesabımı Oluştur →</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Welcome, {{hr_name}}!</h2><p>You have been invited as an HR Admin for {{company_name}}. Create your account to start your company's wellbeing journey.</p><div class="cta-container"><a href="{{invite_link}}" class="cta-button">Create My Account →</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{hr_name}}", "{{company_name}}", "{{invite_link}}"]	HR Admin davet mesajı	t	2026-04-28 13:06:39.311853+03	\N
9d4d6cd8-a565-4570-b7ff-24d1a6aa04ad	password_reset	Şifre Sıfırlama Talebi	Password Reset Request	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Şifrenizi mi Unuttunuz?</h2><p>Merhaba {{user_name}}, şifrenizi sıfırlamak için aşağıdaki butonu kullanabilirsiniz. Bu link {{expires_in}} boyunca geçerlidir.</p><div class="cta-container"><a href="{{reset_link}}" class="cta-button">Şifremi Sıfırla</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Forgot Your Password?</h2><p>Hello {{user_name}}, use the button below to reset your password. This link is valid for {{expires_in}}.</p><div class="cta-container"><a href="{{reset_link}}" class="cta-button">Reset Password</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{user_name}}", "{{reset_link}}", "{{expires_in}}"]	Şifre sıfırlama linki	t	2026-04-28 13:06:39.311853+03	\N
760f19dc-f316-49f3-bd56-19e938c37198	survey_token_invite	🌱 Wellbeing Anketiniz Hazır	🌱 Your Wellbeing Survey is Ready	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Anketiniz Sizi Bekliyor!</h2><p>Merhaba {{full_name}}, {{company_name}} tarafından düzenlenen <b>{{survey_title}}</b> anketi için katılımınız bekleniyor. Görüşleriniz tamamen anonimdir.</p><p>Son katılım: {{due_date}}</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Ankete Başla →</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Your Survey is Waiting!</h2><p>Hello {{full_name}}, your participation is requested for the <b>{{survey_title}}</b> survey organized by {{company_name}}. Your feedback is completely anonymous.</p><p>Due date: {{due_date}}</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Start Survey →</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{full_name}}", "{{company_name}}", "{{survey_title}}", "{{survey_link}}", "{{due_date}}"]	Bireysel anket davetiyesi	t	2026-04-28 13:06:39.311853+03	\N
c57d86ea-f9ea-4fdb-8781-c9063c9cf96a	employee_invite	Wellbeing Hesabınızı Oluşturun	Create Your Wellbeing Account	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Ekibimize Hoş Geldiniz!</h2><p>Merhaba {{full_name}}, {{company_name}} wellbeing platformuna erişiminiz tanımlandı. Aşağıdaki butona tıklayarak kaydınızı tamamlayabilirsiniz.</p><div class="cta-container"><a href="{{invite_link}}" class="cta-button">Kayıt Ol</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Welcome to the Team!</h2><p>Hello {{full_name}}, your access to the {{company_name}} wellbeing platform has been defined. Click the button below to complete your registration.</p><div class="cta-container"><a href="{{invite_link}}" class="cta-button">Sign Up</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{full_name}}", "{{company_name}}", "{{invite_link}}"]	Çalışan kayıt davetiyesi	t	2026-04-28 13:06:39.311853+03	\N
32419d7f-79e7-4f95-88b9-96404c354de7	campaign_invite	📋 Yeni Bir Araştırma Başladı	📋 A New Research Has Started	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Görüşleriniz Bizim İçin Önemli</h2><p>Merhaba {{full_name}}, şirketimizde <b>{{survey_title}}</b> araştırması başladı. Lütfen linke tıklayarak katılım sağlayın.</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Katıl</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Your Feedback is Important</h2><p>Hello {{full_name}}, the <b>{{survey_title}}</b> research has started in our company. Please click the link to participate.</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Participate</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{full_name}}", "{{company_name}}", "{{survey_title}}", "{{survey_link}}"]	Kampanya bazlı anket daveti	t	2026-04-28 13:06:39.311853+03	\N
c58d29e8-310f-4d59-9e87-e9d14deeb46a	campaign_reminder	⏰ Hatırlatma: Anketinizi Tamamlayın	⏰ Reminder: Complete Your Survey	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Az Kaldı!</h2><p>Merhaba {{full_name}}, <b>{{survey_title}}</b> anketini tamamlamanız için son {{days_remaining}} gün. Henüz vaktiniz varken görüşlerinizi bildirmeyi unutmayın.</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Anketi Tamamla</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Almost There!</h2><p>Hello {{full_name}}, there are only {{days_remaining}} days left to complete the <b>{{survey_title}}</b> survey. Don't forget to submit your feedback while you still have time.</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Complete Survey</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{full_name}}", "{{survey_title}}", "{{survey_link}}", "{{days_remaining}}"]	Kampanya hatırlatma mesajı	t	2026-04-28 13:06:39.311853+03	\N
7ed92492-4500-4061-83a0-577915138a67	survey_reminder	⏰ Anketinizi Tamamlamayı Unutmayın	⏰ Don't Forget to Complete Your Survey	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Görüşleriniz Değerlidir</h2><p>Merhaba {{full_name}}, devam eden <b>{{survey_title}}</b> anketiniz için son {{days_remaining}} gün. Katılımınız için şimdiden teşekkürler.</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Hemen Tamamla</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Your Opinion Matters</h2><p>Hello {{full_name}}, there are {{days_remaining}} days left for your ongoing <b>{{survey_title}}</b> survey. Thank you for your participation.</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Complete Now</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{full_name}}", "{{survey_title}}", "{{survey_link}}", "{{days_remaining}}"]	Genel anket hatırlatması	t	2026-04-28 13:06:39.311853+03	\N
b598b8a5-96ab-4819-a64f-a13b1e670e1c	survey_closed	📊 Wellbeing Sonuçları Hazır	📊 Wellbeing Results are Ready	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Analizler Tamamlandı</h2><p>Sayın {{hr_name}}, {{company_name}} için <b>{{period}}</b> dönemi wellbeing araştırması sona erdi. %{{participation_rate}} katılım oranı ile elde edilen sonuçları dashboard üzerinden inceleyebilirsiniz.</p><div class="cta-container"><a href="{{dashboard_link}}" class="cta-button">Sonuçları Gör</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Analysis Completed</h2><p>Dear {{hr_name}}, the wellbeing research for <b>{{period}}</b> at {{company_name}} has ended. You can review the results obtained with a {{participation_rate}}% participation rate on the dashboard.</p><div class="cta-container"><a href="{{dashboard_link}}" class="cta-button">View Results</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{hr_name}}", "{{company_name}}", "{{period}}", "{{participation_rate}}", "{{dashboard_link}}"]	Anket kapanış ve rapor hazır bildirimi	t	2026-04-28 13:06:39.311853+03	\N
b4a37888-395b-4a20-a564-eae4344fc5d2	score_alert	⚠️ Düşük Wellbeing Skoru Uyarısı	⚠️ Low Wellbeing Score Alert	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Dikkat Gereken Alan Tespit Edildi</h2><p>Sayın {{hr_name}}, son araştırmada <b>{{dimension}}</b> boyutu skoru <b>{{score}}</b> olarak ölçülmüştür (Önceki: {{previous_score}}). Bu alanda aksiyon almanız önerilir.</p><div class="cta-container"><a href="{{dashboard_link}}" class="cta-button">Detayları İncele</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Area Requiring Attention Detected</h2><p>Dear {{hr_name}}, the <b>{{dimension}}</b> dimension score in the latest research was measured as <b>{{score}}</b> (Previous: {{previous_score}}). Taking action in this area is recommended.</p><div class="cta-container"><a href="{{dashboard_link}}" class="cta-button">Review Details</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{hr_name}}", "{{dimension}}", "{{score}}", "{{previous_score}}", "{{dashboard_link}}"]	Skor eşiği uyarısı	t	2026-04-28 13:06:39.311853+03	\N
4e38b309-bfca-453a-9c1f-8d8e918227b9	ai_ready	🤖 AI Analizi Hazır	🤖 AI Analysis is Ready	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Yapay Zeka Raporu Hazır</h2><p>Sayın {{hr_name}}, <b>{{period}}</b> dönemi için açık uçlu yanıtlar yapay zeka tarafından analiz edildi. Stratejik önerileri panelinizde bulabilirsiniz.</p><div class="cta-container"><a href="{{dashboard_link}}" class="cta-button">Analizi Oku</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>AI Report is Ready</h2><p>Dear {{hr_name}}, the open-ended responses for <b>{{period}}</b> have been analyzed by AI. You can find strategic suggestions in your panel.</p><div class="cta-container"><a href="{{dashboard_link}}" class="cta-button">Read Analysis</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{hr_name}}", "{{period}}", "{{dashboard_link}}"]	AI analizi tamamlandı bildirimi	t	2026-04-28 13:06:39.311853+03	\N
c5579707-2df9-44e9-843d-bf464e2cc8b9	plan_expiry	⚠️ Aboneliğiniz Sona Ermek Üzere	⚠️ Your Subscription is About to Expire	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Abonelik Uyarısı</h2><p>{{company_name}} için mevcut <b>{{plan_name}}</b> paketinizin süresi {{days_remaining}} gün içinde dolacaktır. Hizmet kesintisi yaşamamak için lütfen yenileyin.</p><div class="cta-container"><a href="{{platform_url}}/settings/billing" class="cta-button">Şimdi Yenile</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Subscription Warning</h2><p>Your current <b>{{plan_name}}</b> package for {{company_name}} will expire in {{days_remaining}} days. Please renew to avoid service interruption.</p><div class="cta-container"><a href="{{platform_url}}/settings/billing" class="cta-button">Renew Now</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{company_name}}", "{{days_remaining}}", "{{plan_name}}"]	Plan bitiş uyarısı	t	2026-04-28 13:06:39.311853+03	\N
d3dd1fdc-dc9c-45f8-b85d-6698763fdbf8	report_ready	📑 Raporunuz İndirilmeye Hazır	📑 Your Report is Ready for Download	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Rapor Hazır</h2><p>Sayın {{hr_name}}, <b>{{period}}</b> dönemi için talep ettiğiniz <b>{{format}}</b> formatındaki rapor oluşturuldu.</p><div class="cta-container"><a href="{{download_link}}" class="cta-button">Raporu İndir</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Report Ready</h2><p>Dear {{hr_name}}, the report in <b>{{format}}</b> format you requested for <b>{{period}}</b> has been created.</p><div class="cta-container"><a href="{{download_link}}" class="cta-button">Download Report</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{hr_name}}", "{{period}}", "{{format}}", "{{download_link}}"]	İndirilebilir rapor bildirimi	t	2026-04-28 13:06:39.311853+03	\N
0ac0a41c-c866-4721-9c17-f946a559bf72	report_failed	❌ Rapor Oluşturulamadı	❌ Report Generation Failed	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Hata Oluştu</h2><p>Sayın {{hr_name}}, <b>{{period}}</b> dönemi raporu oluşturulurken teknik bir sorun yaşandı. Lütfen tekrar deneyin veya destek ekibiyle iletişime geçin.</p><div class="cta-container"><a href="mailto:{{support_email}}" class="cta-button">Yardım Al</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>An Error Occurred</h2><p>Dear {{hr_name}}, a technical problem occurred while generating the <b>{{period}}</b> report. Please try again or contact the support team.</p><div class="cta-container"><a href="mailto:{{support_email}}" class="cta-button">Get Help</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{hr_name}}", "{{period}}", "{{format}}", "{{support_email}}"]	Rapor hata bildirimi	t	2026-04-28 13:06:39.311853+03	\N
053e192a-8135-4b48-9f98-f73bc939c842	draft_reminder	📝 Yarım Kalan Anketiniz Sizi Bekliyor	📝 Your Incomplete Survey is Waiting	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Nerede Kalmıştık?</h2><p>Merhaba {{full_name}}, <b>{{survey_title}}</b> anketine başladınız ancak henüz bitirmediniz. Kaldığınız yerden devam ederek sonuca ulaşabilirsiniz.</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Devam Et</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Where Were We?</h2><p>Hello {{full_name}}, you started the <b>{{survey_title}}</b> survey but haven't finished yet. You can continue from where you left off.</p><div class="cta-container"><a href="{{survey_link}}" class="cta-button">Continue</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{full_name}}", "{{survey_title}}", "{{survey_link}}", "{{due_date}}"]	Taslak anket hatırlatması	t	2026-04-28 13:06:39.311853+03	\N
f6a4d308-3b72-47c7-b22d-7fe14631bd8d	campaign_bounced	⚠️ Teslim Edilemeyen Mailler	⚠️ Undelivered Emails	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Teslimat Sorunu</h2><p>Sayın {{hr_name}}, son kampanyada <b>{{bounced_count}}</b> adet mail alıcıya ulaşılamadığı için geri döndü. Lütfen mail adreslerini kontrol edin.</p><div class="cta-container"><a href="{{dashboard_link}}" class="cta-button">Listeyi Gör</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><h1>🌱 Wellbeing Platformu</h1></div><div class="content"><h2>Delivery Issue</h2><p>Dear {{hr_name}}, in the latest campaign, <b>{{bounced_count}}</b> emails bounced back because they could not reach the recipient. Please check the email addresses.</p><div class="cta-container"><a href="{{dashboard_link}}" class="cta-button">View List</a></div></div><div class="footer"><p><b>WellAnalytics</b></p><p>Sorularınız için <a href="mailto:destek@wellanalytics.io">destek@wellanalytics.io</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	["{{hr_name}}", "{{bounced_count}}", "{{dashboard_link}}"]	Hatalı mail uyarısı	t	2026-04-28 13:06:39.311853+03	\N
01ccab22-bd9a-43a4-9087-9aa616963437	consultant_invite	Eğitmen Hesabınızı Oluşturun	Create Your Consultant Account	<html><body><h2>Merhaba {{full_name}},</h2><p>WellAnalytics platformuna Eğitmen olarak davet edildiniz. Hesabınızı aktifleştirmek ve şifrenizi belirlemek için aşağıdaki bağlantıya tıklayabilirsiniz:</p><p><a href="{{invite_link}}" style="background:#2563eb;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Hesabımı Aktifleştir</a></p><p>Bu bağlantı {{expires_in}} boyunca geçerlidir.</p><br><p>İyi çalışmalar,<br>WellAnalytics Ekibi</p></body></html>	<html><body><h2>Hello {{full_name}},</h2><p>You have been invited to WellAnalytics as a Consultant. Click the link below to activate your account and set your password:</p><p><a href="{{invite_link}}" style="background:#2563eb;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Activate My Account</a></p><p>This link is valid for {{expires_in}}.</p><br><p>Best regards,<br>WellAnalytics Team</p></body></html>	["full_name", "invite_link", "expires_in"]	Eğitmen davet e-postası	t	2026-04-30 15:38:02.809704+03	\N
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.payments (id, consultant_id, subscription_id, amount, currency, status, provider, provider_payment_id, invoice_url, metadata, created_at) FROM stdin;
4ae8669f-33b4-491b-bf15-679249347462	79c0d7dc-b452-4460-beaf-d9ff7564eec9	\N	799.00	TRY	completed	stripe	\N	https://example.com/invoice.pdf	\N	2026-04-29 17:35:43.608827
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
\.


--
-- Data for Name: survey_responses; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.survey_responses (id, survey_id, assignment_id, user_id, company_id, department_id, tenure_months, is_anonymous, submitted_at, period) FROM stdin;
\.


--
-- Data for Name: survey_throttle; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.survey_throttle (id, user_id, survey_id, last_submitted_at) FROM stdin;
\.


--
-- Data for Name: survey_tokens; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.survey_tokens (id, survey_id, assignment_id, company_id, department_id, is_used, expires_at, created_at, due_at, metadata, token, email, full_name, language) FROM stdin;
\.


--
-- Data for Name: surveys; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.surveys (id, company_id, title_tr, title_en, description_tr, description_en, is_anonymous, is_active, throttle_days, starts_at, ends_at, created_by, created_at, updated_at, type, frequency) FROM stdin;
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
962dc6e8-b61e-4992-a7b9-4c4d797c2277	\N	\N	onureksi@outlook.com	$2a$12$cdULvaZfWWBHYBBXwVt8nuv028i4le6ZvK6KD7mKP8H0ucasIa9AS	Onur Consultant	consultant	\N	\N	\N	\N	\N	\N	tr	t	\N	2026-05-01 11:50:42.380448+03
581a1ca7-8c54-4bc1-98f8-5498019fa891	432402c8-2ad5-44ae-bc36-d919ee9956e7	\N	test_invite_v5@wellanalytics.io	\N	Test Invite V5	hr_admin	\N	\N	\N	\N	\N	\N	tr	t	\N	2026-05-01 13:44:28.183864+03
40245aa3-35ab-45b1-a8c1-bf119e9c032c	\N	\N	admin@wellanalytics.com	$2a$10$DjuhSXVgWrb5rf3LUrS98e3f368xgwG7qVpAc/uK.1EmdlDZSbrz2	Sistem Yöneticisi	super_admin	\N	\N	\N	\N	\N	\N	tr	t	2026-05-01 14:13:42.504+03	2026-04-28 13:16:15.597027+03
79c0d7dc-b452-4460-beaf-d9ff7564eec9	\N	\N	onur@3bitz.com	$2b$10$IQxbZAIFQFeJWuDmR9/5/uZM/DKH1eoVg.aPGK744P.5i7bakJaKu	Onur Ekşi	consultant	\N	\N	\N	\N	\N	\N	tr	t	2026-05-01 11:37:16.262+03	2026-04-30 17:27:36.406521+03
\.


--
-- Data for Name: wellbeing_scores; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.wellbeing_scores (id, company_id, score, calculated_at, response_count, period, segment_type, segment_value, dimension) FROM stdin;
\.


--
-- Name: typeorm_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wellanalytics
--

SELECT pg_catalog.setval('public.typeorm_migrations_id_seq', 11, true);


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

\unrestrict jrq2lejAGvnQwoCLE8ekoH7cKYwhtnz5LZPsv1xo7Y9lFZ5crTGPRoVzF1uDeZG

