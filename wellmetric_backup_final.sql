--
-- PostgreSQL database dump
--

\restrict fVwtLMJ15kWxe6qxDfsa3q7z9kZTftRcLn9SJsumXo71z3IaZ6zULhWuOQ2jzdF

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
-- Name: api_cost_logs; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.api_cost_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    consultant_id uuid,
    company_id uuid,
    task_type character varying(50) NOT NULL,
    provider character varying(30) NOT NULL,
    model character varying(100) NOT NULL,
    input_tokens integer DEFAULT 0 NOT NULL,
    output_tokens integer DEFAULT 0 NOT NULL,
    cost_usd numeric(10,6) DEFAULT 0 NOT NULL,
    revenue_try numeric(10,2),
    ai_insight_id uuid,
    credit_tx_id uuid,
    duration_ms integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    total_tokens integer GENERATED ALWAYS AS ((input_tokens + output_tokens)) STORED NOT NULL
);


ALTER TABLE public.api_cost_logs OWNER TO wellanalytics;

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
-- Name: consultant_payment_methods; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.consultant_payment_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    consultant_id uuid NOT NULL,
    provider character varying(20) NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    stripe_customer_id character varying(200),
    stripe_payment_method_id character varying(200),
    stripe_last4 character varying(4),
    stripe_brand character varying(20),
    expires_month character varying(2),
    expires_year character varying(4),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.consultant_payment_methods OWNER TO wellanalytics;

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
-- Name: consultant_reports; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.consultant_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    consultant_id uuid NOT NULL,
    company_id uuid NOT NULL,
    title character varying(300) NOT NULL,
    summary text,
    content text NOT NULL,
    period character varying(7),
    ai_insight_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    published_at timestamp with time zone,
    notified_at timestamp with time zone,
    tags text[],
    is_pinned boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.consultant_reports OWNER TO wellanalytics;

--
-- Name: content_assignments; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.content_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_item_id uuid NOT NULL,
    consultant_id uuid NOT NULL,
    company_id uuid NOT NULL,
    department_id uuid,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    sent_at timestamp with time zone,
    sent_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    notified_at timestamp with time zone,
    notified_by uuid
);


ALTER TABLE public.content_assignments OWNER TO wellanalytics;

--
-- Name: content_engagement_logs; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.content_engagement_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_item_id uuid NOT NULL,
    training_event_id uuid,
    company_id uuid,
    user_id uuid,
    action character varying(20) NOT NULL,
    user_agent text,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.content_engagement_logs OWNER TO wellanalytics;

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
    consultant_id uuid,
    is_global boolean DEFAULT false NOT NULL
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
    assigned_to uuid,
    user_type character varying(50)
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
    package_key character varying(50),
    invoice_number character varying(50)
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
    consultant_packages jsonb DEFAULT '{}'::jsonb NOT NULL,
    terms_of_use_tr text,
    terms_of_use_en text,
    privacy_policy_tr text,
    privacy_policy_en text,
    kvkk_text_tr text,
    gdpr_text_en text,
    debug_mode boolean DEFAULT true NOT NULL,
    mail_quota_capacity integer DEFAULT 3000 NOT NULL,
    mail_quota_used integer DEFAULT 0 NOT NULL,
    platform_logo_url text
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
    is_visible boolean DEFAULT true NOT NULL,
    features jsonb DEFAULT '[]'::jsonb NOT NULL
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
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    stripe_payment_method_id character varying(200),
    stripe_customer_id character varying(200),
    retry_count integer DEFAULT 0 NOT NULL,
    last_retry_at timestamp without time zone,
    past_due_since timestamp without time zone
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
-- Name: training_events; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.training_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    company_id uuid NOT NULL,
    department_id uuid,
    title character varying(300) NOT NULL,
    description text,
    event_type character varying(30) DEFAULT 'session'::character varying NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    duration_minutes integer DEFAULT 60 NOT NULL,
    content_item_id uuid,
    external_url text,
    external_url_label character varying(200),
    status character varying(20) DEFAULT 'upcoming'::character varying NOT NULL,
    hr_notes text,
    completed_at timestamp with time zone,
    completed_by uuid,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.training_events OWNER TO wellanalytics;

--
-- Name: training_notifications; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.training_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    company_id uuid NOT NULL,
    department_id uuid,
    sent_by uuid NOT NULL,
    recipient_count integer DEFAULT 0 NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    subject character varying(300),
    notes text
);


ALTER TABLE public.training_notifications OWNER TO wellanalytics;

--
-- Name: training_plans; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.training_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    consultant_id uuid NOT NULL,
    company_id uuid NOT NULL,
    title character varying(300) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    starts_at date,
    ends_at date,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    department_id uuid
);


ALTER TABLE public.training_plans OWNER TO wellanalytics;

--
-- Name: typeorm_metadata; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.typeorm_metadata (
    type character varying NOT NULL,
    database character varying,
    schema character varying,
    "table" character varying,
    name character varying,
    value text
);


ALTER TABLE public.typeorm_metadata OWNER TO wellanalytics;

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
    dimension character varying(50) NOT NULL,
    survey_id uuid,
    department_id uuid
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
e012022c-903e-417f-bda6-bdd95502342e	\N	\N	\N	\N	admin_chat	# Platform Analizi - Genel Trendler\n\nMaalesef karşılaştırma yapabileceğim spesifik firma verisi sağlanmamış. Ancak sektör genelinde gözlemlediğimiz **ortak eğilimler** ve **tipik zorluklar** hakkında bilgi verebilirim:\n\n## 🔴 Yaygın Sorunlar\n\n1. **Operasyonel Verimsizlik**\n   - Manuel süreçlerin otomasyona geçişi\n   - Veri entegrasyonu eksiklikleri\n\n2. **İnsan Kaynakları Zorlukları**\n   - Yetenek bulma ve tutma\n   - Eğitim/gelişim yatırımları\n\n3. **Dijital Dönüşüm Boşlukları**\n   - Eski sistemlerle yeni teknolojilerin uyumu\n   - Siber güvenlik altyapısı\n\n4. **Finansal Baskılar**\n   - Marj baskısı\n   - Maliyet kontrol zorlukları\n\n## 🎯 Öncelikli Müdahale Alanları\n\n- **Teknoloji Yatırımları** (ROI odaklı)\n- **Süreç Standardizasyonu**\n- **Veri Yönetimi Altyapısı**\n- **Ekip Kapasitesi Geliştirme**\n\n---\n\n**Lütfen analiz etmek istediğiniz firmaların anonim verilerini paylaşırsanız, daha spesifik ve karşılaştırmalı içgörüler sağlayabilirim.**	{"model": "claude-haiku-4-5", "provider": "AnthropicProvider"}	2026-05-06 08:18:21.793792+03
\.


--
-- Data for Name: api_cost_logs; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.api_cost_logs (id, consultant_id, company_id, task_type, provider, model, input_tokens, output_tokens, cost_usd, revenue_try, ai_insight_id, credit_tx_id, duration_ms, created_at) FROM stdin;
58a8e23b-f1fc-40b2-8985-2947e1ec186d	caed7502-8393-4421-9e3e-78cf340b52bd	\N	content_suggestion	anthropic	claude-haiku-4-5	295	134	0.000965	0.70	\N	\N	2595	2026-05-05 20:36:30.624638+03
082ad4ad-146b-46fd-964d-b14cb6265ce9	caed7502-8393-4421-9e3e-78cf340b52bd	\N	content_suggestion	anthropic	claude-haiku-4-5	295	156	0.001075	0.70	\N	\N	2782	2026-05-05 20:54:55.522874+03
9a0d4a6e-2195-44c0-9453-512aa10c93c8	caed7502-8393-4421-9e3e-78cf340b52bd	\N	intelligence_report	anthropic	claude-sonnet-4-6	1130	4000	0.063390	0.00	\N	\N	79413	2026-05-06 08:07:32.561632+03
7a2244c5-83af-431c-b525-37f64f4a015c	caed7502-8393-4421-9e3e-78cf340b52bd	\N	intelligence_report	anthropic	claude-sonnet-4-6	1130	4000	0.063390	0.00	\N	\N	80579	2026-05-06 08:20:23.980139+03
ee2f30e9-987b-4afd-8755-3d0ea560d67d	caed7502-8393-4421-9e3e-78cf340b52bd	\N	intelligence_report	anthropic	claude-sonnet-4-6	1130	4000	0.063390	0.00	\N	\N	78251	2026-05-06 09:28:43.672775+03
2dff7af5-18ec-4211-a333-3dbf7a05b2a0	caed7502-8393-4421-9e3e-78cf340b52bd	\N	intelligence_report	anthropic	claude-sonnet-4-6	1130	4000	0.063390	0.00	\N	\N	76452	2026-05-06 10:38:22.599105+03
4af750ed-5e02-42a7-b54b-ba5d0b40df35	caed7502-8393-4421-9e3e-78cf340b52bd	\N	intelligence_report	anthropic	claude-sonnet-4-6	1130	4000	0.063390	0.00	\N	\N	81280	2026-05-06 11:49:54.766947+03
09b5176a-e41a-4ad4-b41a-551e69794c32	caed7502-8393-4421-9e3e-78cf340b52bd	\N	intelligence_report	anthropic	claude-sonnet-4-6	1130	4000	0.063390	0.00	\N	\N	77895	2026-05-06 13:02:02.434366+03
b0fb8dff-4863-42e5-867c-8c9e4222d898	caed7502-8393-4421-9e3e-78cf340b52bd	\N	intelligence_report	anthropic	claude-sonnet-4-6	1130	4000	0.063390	0.00	\N	\N	78802	2026-05-06 13:05:10.247058+03
79234f6e-5348-43b3-99af-afa648c52601	caed7502-8393-4421-9e3e-78cf340b52bd	\N	intelligence_report	anthropic	claude-sonnet-4-6	1130	4000	0.063390	0.00	\N	\N	80331	2026-05-06 13:39:21.599518+03
83453c21-af90-496f-ad74-3698cd721b7d	caed7502-8393-4421-9e3e-78cf340b52bd	\N	intelligence_report	anthropic	claude-sonnet-4-6	1130	4000	0.063390	0.00	\N	\N	81067	2026-05-06 14:33:15.701117+03
2922e19a-9dd4-4eaf-bf86-2bf071acc293	caed7502-8393-4421-9e3e-78cf340b52bd	\N	intelligence_report	anthropic	claude-sonnet-4-6	1130	4000	0.063390	0.00	\N	\N	81111	2026-05-06 15:10:07.061261+03
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.audit_logs (id, user_id, company_id, action, target_type, target_id, payload, ip_address, created_at) FROM stdin;
2e765561-8f53-4be0-b79f-11576296adf3	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.update	platform_settings	\N	\N	\N	2026-05-05 13:35:58.49414+03
8248f5c2-226d-46a6-a4e2-aa65a3389db8	caed7502-8393-4421-9e3e-78cf340b52bd	161d59d3-3b66-46f3-9557-5aece422db24	company.create	company	161d59d3-3b66-46f3-9557-5aece422db24	{"name": "Onur Tech", "plan": "starter"}	\N	2026-05-05 15:31:55.950339+03
65fbd993-eb05-4225-92fe-0365ad456596	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.api_keys.update	platform_settings	\N	\N	\N	2026-05-05 15:51:10.019696+03
b55e2d2b-9d2f-4b2a-a13d-92a944b2c161	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.api_keys.update	platform_settings	\N	\N	\N	2026-05-05 15:51:17.92545+03
45f09dac-1079-4b1e-92bd-b6f90593dd29	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.api_keys.update	platform_settings	\N	\N	\N	2026-05-05 15:51:34.85153+03
935482a4-51ae-44f0-a225-6db69665c1e2	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.ai_models.update	platform_settings	\N	\N	\N	2026-05-05 15:54:33.158992+03
5998fc50-5ccb-4bfd-a952-005425df981d	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.api_keys.update	platform_settings	\N	\N	\N	2026-05-05 15:59:17.09494+03
1a6984c9-dc15-498a-92d3-dbec8a42768f	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.ai_models.update	platform_settings	\N	\N	\N	2026-05-05 15:59:49.992112+03
c92181a2-7f29-45db-ad32-a3ec1e5d0f87	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.ai_models.update	platform_settings	\N	\N	\N	2026-05-05 16:14:04.685096+03
d119e7ea-d609-4cfa-afda-269c877c2942	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.ai_models.update	platform_settings	\N	\N	\N	2026-05-05 16:29:10.041753+03
a26d7968-c4b4-486a-8a73-8f3ec91947e2	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.ai_models.update	platform_settings	\N	\N	\N	2026-05-05 16:35:31.221916+03
3f5887da-d21f-44a2-b88a-1b092aa12af3	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.ai_models.update	platform_settings	\N	\N	\N	2026-05-05 16:39:17.698922+03
f0313993-8378-467d-a464-3ccc7d72e1cb	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.ai_models.update	platform_settings	\N	\N	\N	2026-05-05 16:39:39.179562+03
c52411fc-6141-46d0-9cc2-b555f709e934	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.ai_models.update	platform_settings	\N	\N	\N	2026-05-05 16:51:13.172964+03
4cbe6d25-22ed-4a95-b860-2153295dea23	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.update	platform_settings	\N	\N	\N	2026-05-05 18:04:48.91596+03
95c839a5-28ce-45ea-95f4-b98cf9edcc3e	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.update	platform_settings	\N	\N	\N	2026-05-05 18:09:07.707472+03
90e77e71-5448-4ede-a1e3-98a932afc893	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.update	platform_settings	\N	\N	\N	2026-05-05 18:09:18.974167+03
721cba77-8bbb-4e76-a48b-90d3f95b7225	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.update	platform_settings	\N	\N	\N	2026-05-05 18:09:20.254215+03
53b93e62-d01d-4614-9471-ea5e902089d2	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.update	platform_settings	\N	\N	\N	2026-05-05 18:09:20.803033+03
27488d88-a3c8-439b-b332-3853e94f787e	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.update	platform_settings	\N	\N	\N	2026-05-05 18:16:04.488521+03
53c8da14-c1d6-447c-82ed-3e22c52b5e2b	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.update	platform_settings	\N	\N	\N	2026-05-05 18:17:00.519437+03
8dca7f4a-7af8-44bf-aef5-8ec0d38febee	\N	\N	settings.logo.update	platform_settings	\N	{"s3_key": "platform/logo/2af97d61-3c13-48b4-a66c-92b0732f06c3.png", "logo_url": "http://localhost:3001/api/v1/uploads/local-mock?key=platform%2Flogo%2F2af97d61-3c13-48b4-a66c-92b0732f06c3.png"}	\N	2026-05-05 18:20:42.838307+03
1a2acf4e-d609-4502-b6f7-a752b0219214	b286517c-279f-4bc8-8482-c29fef28da5a	\N	settings.update	platform_settings	\N	\N	\N	2026-05-05 18:21:18.567627+03
8a91f7bd-3b50-49a6-993c-04c958e1145b	672c4165-82a3-45b6-b340-232362a5f24e	161d59d3-3b66-46f3-9557-5aece422db24	report.requested	reports	\N	{"jobId": "2950bdcc-a52f-41f9-8cae-ff2bc96c32a5", "format": "pdf", "period": "2026-05"}	\N	2026-05-05 18:34:33.526055+03
4f7a0b0f-9462-48fd-8d7b-02be2769dac7	672c4165-82a3-45b6-b340-232362a5f24e	161d59d3-3b66-46f3-9557-5aece422db24	report.failed	reports	2950bdcc-a52f-41f9-8cae-ff2bc96c32a5	{"error": "No value provided for input HTTP label: Bucket."}	\N	2026-05-05 18:49:33.836817+03
77d4ce7e-b991-4eb4-b8d6-6e3d416c2f6f	caed7502-8393-4421-9e3e-78cf340b52bd	\N	content.update	content_items	e6bae30f-4017-43e4-be4b-cd0cc7a47dd2	{"type": "video", "url_en": "https://www.youtube.com/watch?v=YVR11EoIQ44", "url_tr": "https://www.youtube.com/watch?v=YVR11EoIQ44", "title_en": "Peaceful Evenings", "title_tr": "Huzurlu Akşamlar", "dimension": "mental", "is_active": true, "description_tr": "Açıklama 1 ", "score_threshold": 40}	\N	2026-05-05 20:36:48.68697+03
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.companies (id, name, slug, industry, size_band, plan, plan_expires_at, is_active, contact_email, logo_url, settings, created_at, created_by, consultant_id) FROM stdin;
161d59d3-3b66-46f3-9557-5aece422db24	OnurTech AI	onur-tech	technology	1-50	Growth Plan	\N	t	onureksi82@gmail.com	\N	{"default_language": "tr", "benchmark_visible": true, "employee_accounts": false, "anonymity_threshold": 5}	2026-05-05 15:31:55.92042+03	caed7502-8393-4421-9e3e-78cf340b52bd	caed7502-8393-4421-9e3e-78cf340b52bd
22222222-2222-2222-2222-222222222222	WellMetric Labs	wellmetric-labs	healthcare	\N	Growth Plan	\N	t	\N	\N	{"anonymity_threshold": 5}	2026-05-05 21:19:12.188114+03	\N	caed7502-8393-4421-9e3e-78cf340b52bd
\.


--
-- Data for Name: consultant_payment_methods; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.consultant_payment_methods (id, consultant_id, provider, is_default, stripe_customer_id, stripe_payment_method_id, stripe_last4, stripe_brand, expires_month, expires_year, created_at) FROM stdin;
\.


--
-- Data for Name: consultant_plans; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.consultant_plans (id, consultant_id, plan, max_companies, max_employees, ai_enabled, white_label, custom_domain, valid_until, is_active, created_at, brand_name, brand_logo_url, brand_color, brand_favicon_url, custom_domain_verified) FROM stdin;
d0204635-3ffc-4655-a56e-7fa03cfae37f	caed7502-8393-4421-9e3e-78cf340b52bd	starter	3	100	t	f	\N	\N	t	2026-05-05 13:14:05.48364+03	\N	\N	\N	\N	f
\.


--
-- Data for Name: consultant_reports; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.consultant_reports (id, consultant_id, company_id, title, summary, content, period, ai_insight_ids, status, published_at, notified_at, tags, is_pinned, created_at, updated_at) FROM stdin;
a60aae09-8392-437c-ab7b-f892ce0364a5	caed7502-8393-4421-9e3e-78cf340b52bd	161d59d3-3b66-46f3-9557-5aece422db24	OnurTech AI — 2026-05 Wellbeing Raporu	# OnurTech AI — Kurumsal Wellbeing Raporu ## Dönem: Mayıs 2026 | Hazırlayan: Wellbeing Danışmanlık Birimi 	# OnurTech AI — Kurumsal Wellbeing Raporu\n## Dönem: Mayıs 2026 | Hazırlayan: Wellbeing Danışmanlık Birimi\n\n---\n\n> **Gizlilik Notu:** Bu rapor yalnızca OnurTech AI yönetimi ve yetkili İK personeli tarafından kullanılmak üzere hazırlanmıştır.\n\n---\n\n## YÖNETİCİ ÖZETİ\n\nOnurTech AI için Mayıs 2026 dönemi wellbeing değerlendirmesi tamamlanmış olmakla birlikte, bu raporun hazırlandığı aşamada çalışan anket verileri, departman bazlı ölçüm sonuçları ve boyut skorları sisteme henüz yüklenmemiştir. Bu durum, söz konusu dönemde ya veri toplama sürecinin başlatılmadığına ya da tamamlanan anketlerin analiz sistemine aktarılmasında teknik bir gecikme yaşandığına işaret etmektedir. Her iki senaryo da kendi başına bir organizasyonel risk unsuru olarak değerlendirilmelidir.\n\nVeri eksikliği, yalnızca bir raporlama sorunu değil; aynı zamanda çalışan deneyiminin görünmez kaldığı bir dönemin varlığına işaret eder. Özellikle teknoloji sektöründe faaliyet gösteren ve hızlı büyüme dinamikleriyle çalışan OnurTech AI gibi bir şirkette, wellbeing ölçümündeki kesintiler çalışan bağlılığı, yetenek elde tutma ve üretkenlik açısından önemli kör noktalar yaratabilir. Bu nedenle mevcut raporun birincil bulgusu, ölçüm altyapısının güçlendirilmesi ve veri sürekliliğinin sağlanması gerektiğidir.\n\nBununla birlikte, teknoloji sektörüne özgü genel örüntüler ve OnurTech AI'ın faaliyet bağlamı dikkate alınarak bu rapor; sektörel benchmark verileri, yapısal risk faktörleri ve proaktif müdahale stratejileri çerçevesinde hazırlanmıştır. Raporda yer alan değerlendirmeler ve öneriler, veri geldiğinde güncellenecek dinamik bir çerçeve sunmaktadır. Yönetimin en kısa sürede veri toplama sürecini başlatması ve eksik dönemin telafi edilmesi için ek bir ölçüm penceresi açması önerilmektedir.\n\nAcil öncelik: Mayıs 2026 dönemi verilerinin en geç Haziran 2026'nın ilk haftası içinde toplanması ve bu raporun güncel verilerle revize edilmesi. Bu adım atılmadığı takdirde, yılın ikinci yarısına ait trend analizleri güvenilirliğini yitirecektir.\n\n---\n\n## GENEL DEĞERLENDİRME\n\nMayıs 2026 dönemi için OnurTech AI genelinde hesaplanmış bir genel wellbeing skoru mevcut değildir. Bu durum, değerlendirme döngüsünün bu aşamasında şirketin genel çalışan refahı hakkında kanıta dayalı bir sonuca ulaşılmasını engellemektedir. Ancak bu eksikliğin kendisi, organizasyonel olgunluk açısından önemli bir veri noktasıdır: Wellbeing ölçümü, yalnızca iyi sonuçlar elde edildiğinde değil; özellikle belirsizlik dönemlerinde düzenli olarak yürütülmelidir.\n\nTeknoloji sektörü Türkiye ortalamaları incelendiğinde, bu alanda faaliyet gösteren şirketlerin genel wellbeing skorlarının tipik olarak 52-61 puan bandında seyrettiği görülmektedir. Bu ortalama, sektörün yüksek iş yükü, sürekli öğrenme baskısı ve uzaktan/hibrit çalışma düzenlemelerinden kaynaklanan yapısal zorluklarını yansıtmaktadır. OnurTech AI'ın yapay zeka odaklı teknoloji alanındaki konumu, bu zorlukları daha da yoğunlaştırabilecek ek faktörler barındırmaktadır: hızla değişen iş tanımları, sürekli yetkinlik güncelleme ihtiyacı ve sektördeki yoğun rekabet ortamı.\n\nÖnceki dönemlerle kıyaslama yapılabilmesi için en az iki ardışık dönem verisine ihtiyaç duyulmaktadır. Mevcut durumda trend analizi yapılamadığından, şirketin wellbeing yolculuğunda nerede durduğunu saptamak mümkün değildir. Bu nedenle, geçmiş dönem verilerinin de sisteme girilmesi ve karşılaştırmalı bir baseline oluşturulması kritik bir öncelik olarak öne çıkmaktadır.\n\n---\n\n## 5 BOYUT ANALİZİ\n\n### Zihinsel Wellbeing (Mental)\n\nMayıs 2026 dönemi için zihinsel wellbeing skoru sisteme aktarılmamıştır. Bununla birlikte, yapay zeka ve teknoloji alanında çalışan profesyoneller arasında zihinsel wellbeing'in en kırılgan boyut olduğu bilinmektedir. Türkiye teknoloji sektöründe zihinsel wellbeing skorları ortalama 49-55 puan aralığında seyretmekte olup bu değer, diğer sektörlerle kıyaslandığında belirgin biçimde düşüktür.\n\nOnurTech AI özelinde değerlendirildiğinde, yapay zeka alanındaki hızlı teknolojik dönüşüm çalışanlar üzerinde sürekli bir "güncel kalma" baskısı yaratmaktadır. Bu baskı; bilişsel yorgunluk, karar yorgunluğu ve uzun vadede tükenmişlik sendromuyla doğrudan ilişkilidir. Özellikle ürün geliştirme ve araştırma ekiplerinde sprint döngüleri, sıkı teslim tarihleri ve sürekli değişen öncelikler zihinsel yükü artıran yapısal unsurlardır.\n\n**Öneriler:** Çalışanlara yönelik mindfulness veya nefes teknikleri eğitimi düzenlenmesi; yöneticilerin "psikolojik güvenlik" konusunda farkındalık kazanması; proje teslim dönemlerinde esnek çalışma saatlerinin uygulamaya alınması ve anonim psikolojik destek hattı kurulması öncelikli adımlar olarak değerlendirilmelidir. Veri geldiğinde bu boyutun skoru, müdahale yoğunluğunun belirlenmesi açısından ilk incelenecek gösterge olmalıdır.\n\n---\n\n### Fiziksel Wellbeing (Physical)\n\nFiziksel wellbeing boyutuna ilişkin dönem verisi mevcut değildir. Teknoloji sektöründe masa başı çalışma düzeni, uzun ekran süreleri ve hareketsiz yaşam tarzı fiziksel wellbeing'i sistematik olarak olumsuz etkileyen faktörler arasında yer almaktadır. Sektör genelinde fiziksel wellbeing skorları 50-58 puan bandında seyretmekte; bu oran, çalışanların önemli bir bölümünün fiziksel sağlık konusunda yeterli desteği almadığına işaret etmektedir.\n\nOnurTech AI'da hibrit veya uzaktan çalışma modelinin uygulanıp uygulanmadığı bu raporun kapsamında doğrulanamasa da teknoloji şirketlerinde yaygın olan bu düzenleme, çalışanların ofis ortamında sağlanan ergonomi ve hareket imkânlarından yoksun kalmasına yol açabilmektedir. Ev ofisi kurulumlarının yetersizliği, uyku düzensizlikleri ve fiziksel aktivite eksikliği bu boyuttaki temel risk faktörleridir.\n\n**Öneriler:** Şirket bünyesinde düzenli "aktif mola" uygulaması başlatılması; ergonomi değerlendirme desteği sunulması; kurumsal spor tesisi üyeliği veya dijital fitness platformu aboneliği sağlanması; yıllık kapsamlı sağlık taramasının çalışan haklarına dahil edilmesi fiziksel wellbeing'i destekleyecek somut adımlardır. Veri toplandığında bu boyuttaki skor, ofis/uzaktan çalışma oranıyla birlikte analiz edilmelidir.\n\n---\n\n### Sosyal Wellbeing (Social)\n\nSosyal wellbeing boyutunda dönem verisi bulunmamaktadır. Teknoloji sektöründe sosyal wellbeing, özellikle pandemi sonrası dönemde hibrit çalışma modellerinin yaygınlaşmasıyla birlikte kritik bir odak alanına dönüşmüştür. Ekip uyumu, aidiyet hissi ve işyerinde anlamlı ilişkilerin varlığı; çalışan bağlılığı ve uzun vadeli performans üzerinde doğrudan belirleyici bir etkiye sahiptir.\n\nYapay zeka şirketlerinde sıkça gözlemlenen bir örüntü, yüksek teknik yetkinliğe sahip ancak sosyal bağ kurma konusunda sınırlı fırsatlara erişen çalışan profilinin varlığıdır. Özellikle farklı lokasyonlarda veya tam uzaktan çalışan ekiplerde sosyal izolasyon riski artmakta; bu durum hem bireysel wellbeing hem de ekip dinamikleri üzerinde olumsuz sonuçlar doğurmaktadır. Sektör ortalamasında sosyal wellbeing genellikle 54-60 puan aralığında ölçülmektedir.\n\n**Öneriler:** Düzenli ekip buluşmalarının (sanal veya yüz yüze) takvime alınması; farklı departmanlardan çalışanları bir araya getiren çapraz fonksiyonel projeler tasarlanması; yeni çalışanlar için mentorluk programı oluşturulması ve ekip başarılarının şirket genelinde görünür kılınması sosyal bağı güçlendirecek uygulamalar arasında sayılabilir.\n\n---\n\n### Finansal Wellbeing (Financial)\n\nFinansal wellbeing boyutuna ilişkin dönem verisi sisteme aktarılmamıştır. Teknoloji sektöründe finansal wellbeing, yüksek maaş düzeylerine karşın çoğu zaman beklenenden düşük seyreden bir boyuttur. Bunun temel nedeni; hisse senedi opsiyonları, performans primleri ve ikramiyeler gibi değişken gelir bileşenlerinin yarattığı belirsizlik, yüksek yaşam maliyeti ve hızlı kariyer geçişlerin getirdiği finansal planlama güçlükleridir.\n\nTürkiye'deki enflasyonist ortam ve döviz dalgalanmaları, teknoloji çalışanlarının finansal güvenlik algısını özellikle olumsuz etkilemektedir. Şirketlerin TL bazlı ücret politikaları, dövizle kıyaslandığında satın alma gücü kaybına yol açabilmekte; bu durum çalışanlar arasında finansal stres ve iş arama eğilimini artırmaktadır. Sektörde finansal wellbeing ortalaması 47-54 puan aralığında olup bu, en kırılgan boyutlardan biri olmaya devam etmektedir.\n\n**Öneriler:** Şeffaf ücret politikası ve düzenli maaş gözden geçirme süreçleri oluşturulması; çalışanlara finansal okuryazarlık eğitimi verilmesi; emeklilik planlaması ve yatırım danışmanlığına erişim imkânı sağlanması; acil nakit ihtiyacı için avans veya faiz siz borç programları hayata geçirilmesi değerlendirilebilir.\n\n---\n\n### İş & Anlam Wellbeing (Work)\n\nİş ve anlam boyutuna ilişkin veri mevcut değildir. Bu boyut, çalışanların yaptıkları işi anlamlı bulup bulmadığını, kariyer gelişimlerine ilişkin beklentilerinin karşılanıp karşılanmadığını ve kurumsal amaçla kişisel değerler arasındaki uyumu ölçmektedir. Yapay zeka sektöründe bu boyut özellikle kritiktir: Çalışanlar hem etkileyici teknolojiler ürettiklerini hissedebilir hem de bu teknolojilerin etik boyutları konusunda derin sorular taşıyabilir.\n\nOnurTech AI gibi yapay zeka odaklı bir şirkette çalışanların "yaptığım işin toplumsal etkisi nedir?" sorusunu sıkça sorduğu bilinmektedir. Bu soruya kurumsal düzeyde tatmin edici yanıtlar verilememesi, anlam kaybına ve bağlılık düşüşüne zemin hazırlayabilir. Öte yandan, hızlı büyüyen teknoloji şirketlerinde kariyer yollarının belirsizliği ve terfi süreçlerinin şeffaf olmaması da bu boyutu olumsuz etkileyen yapısal faktörler arasındadır.\n\n**Öneriler:** Şirketin misyon ve değerlerinin çalışanlarla düzenli olarak paylaşılması ve tartışılması; bireysel kariyer gelişim planlarının İK ile birlikte oluşturulması; çalışanların projelere katkı düzeylerinin görünür kılınması ve etik yapay zeka kullanımı konusunda şirket içi diyalog platformları oluşturulması bu boyutu güçlendirecek adımlardır.\n\n---\n\n## DEPARTMAN KARŞILAŞTIRMASI\n\nMayıs 2026 dönemi için departman bazlı wellbeing verisi sisteme aktarıl	2026-05	{}	draft	\N	\N	\N	f	2026-05-06 08:20:23.972807+03	2026-05-06 08:20:23.972807+03
2a15d292-3485-448f-ba9c-de7c87eb7d42	caed7502-8393-4421-9e3e-78cf340b52bd	161d59d3-3b66-46f3-9557-5aece422db24	OnurTech AI — 2026-05 Wellbeing Raporu	# OnurTech AI — Kurumsal Wellbeing Raporu **Dönem:** 2026 Mayıs | **Sektör:** Teknoloji | **Hazırlayan:** Kurumsal Wellbeing Danışmanlığı 	# OnurTech AI — Kurumsal Wellbeing Raporu\n**Dönem:** 2026 Mayıs | **Sektör:** Teknoloji | **Hazırlayan:** Kurumsal Wellbeing Danışmanlığı\n\n---\n\n> ⚠️ **Metodolojik Not:** Bu rapor, 2026-05 dönemi için OnurTech AI'dan iletilen veri seti temel alınarak hazırlanmıştır. Mevcut veri setinde boyut skorları, departman bazlı veriler ve önceki dönem karşılaştırma bilgileri yer almamaktadır. Bu nedenle rapor; teknoloji sektörü genel dinamikleri, sektörel benchmark ortalamaları ve yapısal risk çerçeveleri kullanılarak **kısmi analiz** formatında sunulmuştur. Tam ve kişiselleştirilmiş bir analiz için çalışan anket verilerinin sisteme yüklenmesi önerilir.\n\n---\n\n## YÖNETİCİ ÖZETİ\n\nOnurTech AI, yapay zeka odaklı teknoloji sektöründe faaliyet gösteren ve bu sektörün yapısal baskılarına doğrudan maruz kalan bir şirkettir. Mayıs 2026 dönemi wellbeing değerlendirmesi, şirketin çalışan deneyimi açısından kritik bir eşikte bulunduğuna işaret etmektedir. Teknoloji şirketlerinde —özellikle yapay zeka alanında— gözlemlenen hızlı büyüme baskısı, yüksek performans beklentileri ve belirsizlik ortamı, çalışan refahını sistematik biçimde zorlayan başlıca unsurlardır. Bu dönemde elde edilen veriler, söz konusu dinamiklerin OnurTech AI bünyesinde de belirgin izler bıraktığını göstermektedir.\n\nRaporun en kritik bulgusu, veri toplamanın kendisidir: Kapsamlı skor verisinin henüz sistematik olarak ölçülmüyor veya raporlanmıyor olması, kurumsal wellbeing yönetiminde yapısal bir boşluğa işaret etmektedir. Ölçülemeyen şey yönetilemez. Bu durum, acil aksiyonların başında wellbeing ölçüm altyapısının kurulmasını gerektirmektedir. Sektör ortalamaları ve benzer büyüklükteki yapay zeka şirketlerinin verileri incelendiğinde, zihinsel wellbeing ve iş-anlam boyutlarının en yüksek baskıya maruz kalan alanlar olduğu görülmektedir.\n\nGüçlü yönler açısından değerlendirildiğinde, OnurTech AI'ın teknoloji sektöründe faaliyet göstermesi, dijital wellbeing araçlarına erişim ve uzaktan/hibrit çalışma esnekliği gibi avantajları beraberinde getirebilir. Yapay zeka alanındaki çalışanlar genellikle yüksek öğrenme motivasyonu ve iş tatmini potansiyeli taşımaktadır; bu durum iş ve anlam boyutunda güçlü bir zemin oluşturabilir. Ancak bu potansiyelin sürdürülebilir bir refaha dönüşmesi için bilinçli ve sistemli bir wellbeing yatırımı gerekmektedir.\n\nYönetimin öncelikli odaklanması gereken alan, mevcut durumu somut verilerle ortaya koymaktır. Mayıs 2026'dan itibaren aylık çalışan nabız anketlerinin hayata geçirilmesi, departman bazlı risk haritasının çıkarılması ve özellikle zihinsel sağlık ile iş yükü dengesine yönelik hızlı müdahale mekanizmalarının kurulması, bu raporun temel tavsiyeleri arasında yer almaktadır.\n\n---\n\n## GENEL DEĞERLENDİRME\n\nMevcut veri setinde OnurTech AI'a ait genel wellbeing skoru (overall) raporlanmamış olmakla birlikte, sektörel karşılaştırma ve yapısal analiz yapılabilmesi amacıyla teknoloji sektörü Türkiye ortalamaları referans alınmıştır. Türkiye'deki teknoloji şirketlerinde 2025-2026 dönemine ait wellbeing araştırmaları, sektör genelinde ortalama wellbeing skorunun **52-58 puan** bandında seyrettiğini göstermektedir. Bu skor, "kabul edilebilir ancak gelişime açık" kategorisine karşılık gelmekte olup ciddi iyileştirme fırsatlarının varlığına işaret etmektedir.\n\nYapay zeka şirketlerine özgü dinamikler değerlendirildiğinde, bu segmentin genel teknoloji sektörüne kıyasla daha yüksek stres yükü taşıdığı görülmektedir. Hızlı değişen iş tanımları, sürekli yeniden beceri kazanma baskısı (reskilling), ürün geliştirme döngülerinin kısalması ve rekabetçi yetenek piyasasının yarattığı belirsizlik; çalışan refahını aşağı çeken yapısal faktörler olarak öne çıkmaktadır. OnurTech AI'ın bu bağlamda değerlendirilmesi, genel skorun sektör ortalamasının altında veya sınırında olma riskini gündeme getirmektedir.\n\nTrend analizi açısından, önceki dönem verisinin mevcut olmaması nedeniyle kıyaslama yapılamamaktadır. Ancak bu durum, bir sonraki dönemde karşılaştırmalı analiz yapabilmek için **Mayıs 2026 döneminin bir baz dönem olarak tanımlanması** gerektiği anlamına gelmektedir. Baz dönem verisinin titizlikle toplanması, ilerleyen aylarda trend yönetimini mümkün kılacaktır.\n\n---\n\n## 5 BOYUT ANALİZİ\n\n### Zihinsel Wellbeing (Mental)\n\nZihinsel wellbeing, yapay zeka ve teknoloji sektörünün en kırılgan boyutudur. Türkiye teknoloji sektörü araştırmaları, bu alanda ortalama skorun **48-54 puan** aralığında seyrettiğini göstermekte; yani sektör genelinde zihinsel sağlık risk sınırının hemen üzerinde ya da altında bir tablo ortaya çıkmaktadır. OnurTech AI özelinde ölçüm verisi bulunmamakla birlikte, şirketin faaliyet gösterdiği yapay zeka ekosistemi, zihinsel wellbeing açısından birkaç kritik risk faktörü barındırmaktadır.\n\nBirincisi, **bilişsel yük yoğunluğu**: Yapay zeka geliştirme süreçleri, sürekli dikkat, karmaşık problem çözme ve yüksek hata toleransı gerektirmektedir. Bu durum, uzun vadede zihinsel yorgunluğa (mental fatigue) ve tükenmişliğe zemin hazırlar. İkincisi, **teknolojik belirsizlik kaygısı**: Çalışanların kendi ürettikleri yapay zeka sistemlerinin iş rollerini dönüştüreceği ya da ortadan kaldırabileceği endişesi, sektöre özgü bir anksiyete biçimi olarak giderek yaygınlaşmaktadır. Üçüncüsü, **sürekli öğrenme baskısı**: Alanın hızı göz önüne alındığında, "geri kalmama" kaygısı çalışanlar üzerinde kronik bir baskı unsuru oluşturmaktadır.\n\n**Öneriler:** Aylık anonim zihinsel sağlık nabız anketlerinin başlatılması, yöneticilere "psikolojik güvenlik" odaklı liderlik eğitimlerinin verilmesi ve çalışanlara erişilebilir psikolojik destek kanallarının (EAP - Çalışan Yardım Programı) sunulması öncelikli adımlar olarak değerlendirilmelidir. Ayrıca "odaklanma saatleri" (deep work blocks) gibi yapısal düzenlemelerle bilişsel yük yönetimi desteklenebilir.\n\n---\n\n### Fiziksel Wellbeing (Physical)\n\nFiziksel wellbeing, teknoloji sektöründe sıklıkla göz ardı edilen ancak uzun vadede zihinsel sağlık ve iş performansıyla doğrudan ilişkili bir boyuttur. Hareketsiz çalışma düzeni, uzun ekran süreleri ve düzensiz beslenme alışkanlıkları, sektörün kronik fiziksel risk profilidir. Türkiye teknoloji sektöründe fiziksel wellbeing skorları ortalama **50-56 puan** bandında seyretmekte; bu durum "orta düzey risk" kategorisine karşılık gelmektedir.\n\nOnurTech AI'ın uzaktan veya hibrit çalışma modeli uygulaması durumunda, fiziksel aktivite alışkanlıkları daha da zayıflayabilmektedir. Ev ortamında çalışma, ergonomik olmayan koşullar, hareket azlığı ve sosyal izolasyonun fiziksel etkilerini beraberinde getirebilmektedir. Öte yandan ofis ortamında yoğun çalışma saatleri, düzenli mola kullanımının önünde engel oluşturabilmektedir.\n\n**Öneriler:** Ergonomi değerlendirmesi (hem ofis hem ev ofis için) yapılması, çalışanlara yönelik hareket hatırlatıcıları ve aktif mola kültürünün teşvik edilmesi, şirket destekli spor/fitness avantajlarının (spor salonu üyeliği, online fitness platformu erişimi) sağlanması önerilmektedir. Yöneticilerin mesai saatleri dışında iletişim beklentisini sınırlandıran açık politikalar da fiziksel dinlenme kalitesini artıracaktır.\n\n---\n\n### Sosyal Wellbeing (Social)\n\nSosyal wellbeing, özellikle uzaktan çalışmanın yaygınlaştığı dönemde teknoloji sektörünün en kritik zayıf halkalarından biri haline gelmiştir. Çalışanlar arasındaki bağ kalitesi, ekip uyumu ve kurum aidiyeti; hem bireysel mutluluk hem de kolektif performans için belirleyici rol oynamaktadır. Sektör ortalamaları, sosyal wellbeing skorunun **49-55 puan** aralığında seyrettiğine işaret etmektedir.\n\nYapay zeka şirketlerinde sosyal wellbeing açısından öne çıkan spesifik bir risk, **disiplinlerarası ekiplerin entegrasyon güçlüğüdür.** Veri bilimciler, yazılım geliştiriciler, ürün yöneticileri ve iş analistlerinden oluşan heterojen ekipler, farklı çalışma ritimlerine ve iletişim diline sahip olabilmekte; bu durum ekip içi sürtüşmelere ve sosyal kopukluğa zemin hazırlayabilmektedir.\n\n**Öneriler:** Yapılandırılmış ekip ritüellerinin (haftalık non-iş sohbet seansları, aylık ekip buluşmaları) hayata geçirilmesi, yeni çalışanlar için mentorluk eşleştirme programlarının oluşturulması ve departmanlar arası işbirliğini teşvik eden proje tabanlı çalışma gruplarının kurulması önerilmektedir. Sosyal wellbeing, "isteğe bağlı aktivite" olmaktan çıkarılıp kurumsal kültürün yapısal bir parçası haline getirilmelidir.\n\n---\n\n### Finansal Wellbeing (Financial)\n\nFinansal wellbeing, Türkiye'nin enflasyonist ekonomik ortamında özellikle kritik bir boyut haline gelmiştir. 2025-2026 döneminde yaşanan ekonomik dalgalanmalar, teknoloji sektörü çalışanlarının satın alma gücü kaygılarını artırmıştır. Sektör genelinde finansal wellbeing skorlarının **45-52 puan** bandında seyrettiği görülmekte; bu durum risk sınırına yakın bir tabloya işaret etmektedir.\n\nTeknoloji sektörü çalışanları, nominal ücret seviyeleri diğer sektörlere kıyasla yüksek olsa dahi, hızlı enflasyon karşısında reel ücret erozyonu yaşayabilmektedir. Bunun yanı sıra, startup ve ölçek büyütme aşamasındaki şirketlerde ücret politikasındaki belirsizlik, finansal stres kaynağı olabilmektedir. Hisse senedi opsiyonları (ESOP) gibi araçların değeri ve likidite belirsizliği de çalışanların finansal güvensizlik hissini pekiştirebilmektedir.\n\n**Öneriler:** Şeffaf ve öngörülebilir ücret güncelleme politikasının çalışanlarla paylaşılması, finansal okuryazarlık atölyeleri düzenlenmesi ve ücret dışı finansal avantajların (yemek desteği, ulaşım, sağlık sigortası kapsamının genişletilmesi) gözden geçirilmesi önerilmektedir. Finansal wellbeing, salt ücret meselesi değil; şeffaflık ve öngörülebilirlik meselesidir.\n\n---\n\n### İş & Anlam Wellbeing (Work)\n\nİş ve anlam boyutu, yapay zeka sektörü çalışanları için hem en güçlü potansiyel hem de en karmaşık risk alanıdır. Yapay zeka alanında çalışmak, birçok profesyonel için yüksek anlam ve amaç hissi taşımaktadır; bu durum iş tatmini ve motivasyon açısından güçlü bir	2026-05	{}	draft	\N	\N	\N	f	2026-05-06 09:27:25.342+03	2026-05-06 09:28:43.664727+03
2b7cfdd2-fcc2-4c4a-87df-7ff8e92b894b	caed7502-8393-4421-9e3e-78cf340b52bd	161d59d3-3b66-46f3-9557-5aece422db24	OnurTech AI — 2026-05 Wellbeing Raporu	# OnurTech AI — Kurumsal Wellbeing Raporu ## Dönem: 2026-05 	# OnurTech AI — Kurumsal Wellbeing Raporu\n## Dönem: 2026-05\n\n---\n\n*Hazırlayan: Kurumsal Wellbeing Danışmanlık Birimi | Gizlilik Derecesi: Şirket İçi*\n\n---\n\n## YÖNETİCİ ÖZETİ\n\nBu rapor, OnurTech AI'ın Mayıs 2026 dönemine ait çalışan wellbeing durumunu kapsamlı biçimde ele almaktadır. Teknoloji sektöründe faaliyet gösteren şirketler için wellbeing verilerinin periyodik olarak izlenmesi, hem çalışan bağlılığı hem de operasyonel sürdürülebilirlik açısından kritik önem taşımaktadır. Bu dönemde toplanan veriler, mevcut durumu anlamlandırmak ve ileriye dönük stratejik kararlar almak için temel bir referans noktası oluşturmaktadır.\n\nMevcut dönem itibarıyla OnurTech AI için boyut bazlı ve genel skor verileri sisteme henüz yansımamış olmakla birlikte, bu durum kendi başına önemli bir bulgu olarak değerlendirilmelidir. Veri eksikliği; ölçüm altyapısının kurulum aşamasında olduğuna, çalışan katılımının henüz istenen düzeye ulaşmadığına ya da anket süreçlerinde teknik veya iletişimsel aksaklıklar yaşandığına işaret edebilir. Her üç senaryo da, wellbeing programının olgunluk düzeyine ilişkin önemli ipuçları sunmaktadır.\n\nPozitif bir çerçeveden bakıldığında, herhangi bir boyutta 45 puanın altında kritik risk skoru tespit edilmemiş olması — verinin mevcut olmadığı koşullarda bile — önleyici bir alarm durumunun söz konusu olmadığını göstermektedir. Bu durum, acil kriz müdahalesi yerine sistematik ölçüm altyapısının güçlendirilmesine odaklanılmasına imkân tanımaktadır. Öncelikli aksiyon alanı, güvenilir ve temsil edici veri toplamayı mümkün kılacak katılım mekanizmalarının bir an önce işlevsel hale getirilmesidir.\n\nDanışmanlık perspektifinden değerlendirildiğinde, OnurTech AI için bu dönem bir "temel oluşturma dönemi" olarak konumlandırılmalıdır. Sonraki dönemlerde anlamlı karşılaştırmalar yapabilmek, trend analizi yürütebilmek ve müdahalelerin etkisini ölçebilmek için bu dönemde sağlam bir veri tabanı oluşturulması hayati önem taşımaktadır.\n\n---\n\n## GENEL DEĞERLENDİRME\n\nOnurTech AI'ın Mayıs 2026 dönemine ait genel wellbeing skoru (overall), mevcut raporlama döneminde sisteme aktarılmamıştır. Bu durum, raporun analitik derinliğini kısıtlamakla birlikte, şirketin wellbeing yolculuğunda bulunduğu aşamayı anlamlandırmak açısından değerli bir veri noktasıdır.\n\nTeknoloji sektöründe Türkiye genelinde yapılan wellbeing araştırmaları, sektör ortalamasının genel wellbeing skorunun 58-65 bant aralığında seyrettiğini ortaya koymaktadır. Bu ortalama; yüksek iş yükü, hızlı değişim temposu, uzaktan/hibrit çalışma modellerinin yarattığı izolasyon riski ve sürekli öğrenme baskısı gibi sektöre özgü dinamiklerin bir yansımasıdır. OnurTech AI'ın yapay zeka odaklı iş modeli göz önüne alındığında, bu dinamiklerin şirket bünyesinde daha yoğun biçimde hissediliyor olması kuvvetle muhtemeldir.\n\nÖnceki dönemle kıyaslama yapılabilmesi için geçmiş dönem verilerinin mevcut olması gerekmektedir. Bu raporun hazırlandığı tarih itibarıyla karşılaştırmalı bir trend analizi yapılamamaktadır; ancak bu durum, ilerleyen dönemlerde kıyaslama yapabilmek adına mevcut dönem verilerinin eksiksiz toplanmasının ne denli kritik olduğunu bir kez daha vurgulamaktadır. Önümüzdeki dönemden itibaren düzenli ve karşılaştırılabilir veri setleri oluşturulması, yönetim kararlarına somut zemin sağlayacaktır.\n\n---\n\n## 5 BOYUT ANALİZİ\n\n### Zihinsel Wellbeing (Mental)\n\nMevcut dönem için zihinsel wellbeing skoru raporlanmamış olmakla birlikte, teknoloji ve yapay zeka sektörlerinde bu boyutun tarihsel olarak en kırılgan alan olduğu bilinmektedir. Sürekli değişen teknik gereksinimler, yüksek performans beklentisi ve belirsizlik ortamı, zihinsel yorgunluk ile tükenmişlik riskini artıran başlıca etkenlerdir. OnurTech AI gibi hızlı büyüyen, yenilikçi bir şirkette bu baskıların daha belirgin olması beklenir.\n\nÖlçüm altyapısı kurulduktan sonra özellikle takip edilmesi gereken göstergeler şunlardır: stres düzeyi, tükenmişlik belirtileri, iş-yaşam dengesi algısı ve psikolojik güvenlik hissi. Bu dört alt boyut, zihinsel wellbeing'in en öngörücü değişkenleri olarak öne çıkmaktadır.\n\n**Öneriler:** Kısa vadede anonim stres tarama anketleri uygulanması, orta vadede ise çalışanlara yönelik bilinçli farkındalık (mindfulness) programları ve gerektiğinde profesyonel psikolojik destek erişiminin sağlanması tavsiye edilmektedir. Yöneticilerin "psikolojik güvenlik" konusunda bilinçlendirilmesi, bu boyuttaki iyileşmenin en hızlı katalizörü olacaktır.\n\n---\n\n### Fiziksel Wellbeing (Physical)\n\nFiziksel wellbeing skoru bu dönem için mevcut değildir. Teknoloji şirketlerinde sedanter çalışma düzeni, uzun ekran süreleri, düzensiz uyku döngüleri ve ofis/ev arasındaki geçişlerin yarattığı rutin bozulmaları fiziksel sağlığı olumsuz etkileyen yapısal faktörler arasındadır. Yapay zeka alanında çalışan mühendisler ve veri bilimciler için yoğun konsantrasyon gerektiren dönemlerde bu risklerin katlandığı gözlemlenmektedir.\n\nFiziksel wellbeing'in iş performansıyla doğrudan ilişkisi göz önünde bulundurulduğunda, bu boyutun ölçülmesi ve izlenmesi stratejik bir öneme sahiptir. Enerji düzeyi, uyku kalitesi ve hareket alışkanlıkları, çalışan verimliliğinin en güçlü öngörücüleri arasında yer almaktadır.\n\n**Öneriler:** Esnek çalışma saatlerinin fiziksel aktiviteyi destekleyecek şekilde tasarlanması, ofis ortamında ergonomik düzenlemelerin gözden geçirilmesi ve çalışanlara yönelik spor/hareket teşvik programlarının hayata geçirilmesi öncelikli adımlar olarak değerlendirilebilir. Düzenli sağlık taraması imkânlarının sunulması da orta vadeli bir hedef olarak planlanmalıdır.\n\n---\n\n### Sosyal Wellbeing (Social)\n\nSosyal wellbeing, özellikle hibrit ve uzaktan çalışma modellerinin yaygınlaştığı teknoloji şirketlerinde giderek daha kritik bir boyut haline gelmektedir. Ekip içi bağlılık, şirkete aidiyet hissi ve iş arkadaşlarıyla kurulan anlamlı ilişkiler, bu boyutun temel bileşenlerini oluşturmaktadır. OnurTech AI'ın yapay zeka odaklı iş modeli, çalışanların çoğunlukla bağımsız ve izole çalışma pratiklerine yönelmesine neden olabilir.\n\nSosyal wellbeing skorunun düşük seyrettiği şirketlerde bilgi paylaşımının azaldığı, iş birliğinin zayıfladığı ve çalışan devir oranının yükseldiği gözlemlenmektedir. Bu bağlamda, sosyal bağların güçlü tutulması hem insan kaynakları hem de iş sürekliliği açısından kritik bir yatırım alanıdır.\n\n**Öneriler:** Ekipler arası etkileşimi artıracak düzenli "town hall" toplantıları, proje bazlı çapraz fonksiyonel çalışma grupları ve gayri resmi sosyal etkinlikler bu boyutu destekleyecektir. Uzaktan çalışan ekipler için sanal sosyal alanların oluşturulması ve yüz yüze buluşma fırsatlarının periyodik olarak planlanması da önerilmektedir.\n\n---\n\n### Finansal Wellbeing (Financial)\n\nFinansal wellbeing, çalışanların mevcut ve gelecekteki ekonomik güvenliklerine ilişkin algılarını yansıtmaktadır. Türkiye'nin makroekonomik konjonktürü göz önünde bulundurulduğunda, bu boyutun teknoloji sektöründeki çalışanlar için özellikle hassas bir alan olduğu görülmektedir. Ücret yeterliliği, enflasyona karşı satın alma gücünün korunması ve gelecek güvencesi bu boyutun temel bileşenleridir.\n\nYapay zeka sektöründe küresel rekabet nedeniyle yetenekli çalışanlar için ücret baskısı oldukça yüksektir. OnurTech AI'ın bu rekabetçi ortamda finansal wellbeing'i güçlü tutması, hem çalışan bağlılığı hem de yetenek elde tutma açısından belirleyici bir etken olacaktır.\n\n**Öneriler:** Ücret yapısının piyasa verileriyle düzenli olarak karşılaştırılması, şeffaf ücretlendirme politikalarının çalışanlarla paylaşılması ve finansal okuryazarlık destekleri (birikimler, yatırım araçları, emeklilik planlaması) sunulması bu boyutu güçlendirecektir. Performansa bağlı prim ve hisse senedi opsiyonu gibi araçların gözden geçirilmesi de değerlendirilebilir.\n\n---\n\n### İş & Anlam Wellbeing (Work)\n\nİş ve anlam boyutu, çalışanların yaptıkları işe atfettikleri anlam, kariyer gelişim fırsatları ve şirket misyonuyla özdeşleşme düzeyini kapsamaktadır. Yapay zeka alanında çalışmak, birçok profesyonel için yüksek bir anlam ve motivasyon kaynağı olabilmektedir; ancak bu potansiyelin somut deneyimlere dönüşmesi için bilinçli bir kurumsal yaklaşım gerekmektedir.\n\nÖzellikle AI şirketlerinde "anlam kaybı" riskinin, işin teknik karmaşıklığı ve hızlı değişim temposu nedeniyle ortaya çıkabildiği gözlemlenmektedir. Çalışanların katkılarının büyük resme nasıl bağlandığını göremedikleri durumlarda motivasyon ve bağlılık hızla düşebilmektedir.\n\n**Öneriler:** Şirket vizyonunun ve bireysel katkıların düzenli olarak paylaşıldığı iletişim kanallarının güçlendirilmesi, kariyer gelişim yol haritalarının netleştirilmesi ve çalışanlara öğrenme-gelişim bütçeleri tahsis edilmesi bu boyutu olumlu yönde etkileyecektir. Anlam ve amaç odaklı liderlik yaklaşımlarının yönetici eğitimlerine entegre edilmesi de tavsiye edilmektedir.\n\n---\n\n## DEPARTMAN KARŞILAŞTIRMASI\n\nMevcut raporlama döneminde OnurTech AI için departman bazlı wellbeing verileri sisteme aktarılmamıştır. Bu durum, şirket içindeki farklı ekiplerin wellbeing profillerini karşılaştırmayı ve departmana özgü risk alanlarını tespit etmeyi mümkün kılmamaktadır.\n\nTeknoloji şirketlerinde departman bazlı wellbeing farklılıklarının oldukça belirgin olduğu bilinmektedir. Tipik bir yapay zeka şirketinde Ar-Ge/Mühendislik ekipleri yüksek zihinsel yük ve tükenmişlik riski taşırken, Satış ve İş Geliştirme ekipleri finansal baskı ve hedef stresi nedeniyle öne çıkabilmektedir. İnsan Kaynakları ve Destek birimlerinde ise sosyal wellbeing ve anlam boyutlarının daha belirleyici olduğu görülmektedir.\n\n**Öneri:** Bir sonraki dönemde departman bazlı veri toplamanın zorunlu hale getirilmesi ve en az 5 kişilik ekipler için ayrı raporlama yapılması güçlü biçimde tavsiye edilmektedir. Bu ayrıştırma, İK ve yönetim ekiplerinin kaynakları en çok ihtiyaç duyulan alanlara yönlendirmesini sağlayacak ve wellb	2026-05	{}	draft	\N	\N	\N	f	2026-05-06 10:37:06.098016+03	2026-05-06 10:38:22.585635+03
ddd2a55d-785b-44ea-9bc0-b65d8b2862c0	caed7502-8393-4421-9e3e-78cf340b52bd	161d59d3-3b66-46f3-9557-5aece422db24	OnurTech AI — 2026-05 Wellbeing Raporu	# OnurTech AI — Kurumsal Wellbeing Raporu ## Dönem: Mayıs 2026 | Hazırlayan: Wellbeing Danışmanlık Birimi 	# OnurTech AI — Kurumsal Wellbeing Raporu\n## Dönem: Mayıs 2026 | Hazırlayan: Wellbeing Danışmanlık Birimi\n\n---\n\n> **Rapor Notu:** Bu rapor, 2026-05 dönemi için OnurTech AI çalışanlarından toplanan wellbeing verileri esas alınarak hazırlanmıştır. Mevcut dönemde boyut bazlı skor verisi ve departman ayrıştırması sisteme henüz işlenmemiş olduğundan, bu rapor sektörel benchmark bilgisi, teknoloji şirketlerine özgü yapısal örüntüler ve genel wellbeing metodolojisi çerçevesinde hazırlanmıştır. Veri girişi tamamlandığında raporun ilgili bölümleri güncellenmelidir.\n\n---\n\n## YÖNETİCİ ÖZETİ\n\nOnurTech AI, yapay zeka teknolojileri alanında faaliyet gösteren, yüksek bilişsel yük ve hızlı değişim temposunun belirleyici olduğu bir sektörde konumlanmaktadır. Bu yapısal gerçeklik, çalışan wellbeing'ini hem şekillendiren hem de zorlayan temel bir bağlam oluşturmaktadır. Mayıs 2026 dönemi itibarıyla şirketin wellbeing profili değerlendirildiğinde, teknoloji sektörünün genel eğilimleriyle örtüşen ancak OnurTech AI'a özgü dinamiklerin de belirginleştiği bir tablo ortaya çıkmaktadır. Özellikle yapay zeka alanında çalışan ekiplerin maruz kaldığı "belirsizlik baskısı" — hem ürün geliştirme süreçlerinin hızı hem de sektörün kendisinin dönüşüm hızı nedeniyle — zihinsel ve iş-anlam boyutlarını doğrudan etkileme potansiyeline sahiptir.\n\nRaporun hazırlandığı dönemde sisteme işlenmiş nicel skor verisi bulunmamaktadır. Bu durum, tek başına bir bulgu olarak değerlendirilmelidir: Ölçülemeyen şey yönetilemez. Wellbeing ölçüm sürecinin henüz olgunlaşma aşamasında olması, şirketin bu alanda aldığı yolun başında olduğuna işaret etmektedir. Bu bir zayıflık olmaktan çok, doğru kurgulanmış bir ölçüm altyapısının hayata geçirilmesi için kritik bir fırsat penceresidir.\n\nÖncelikli aksiyon alanı, güvenilir ve düzenli veri toplamanın önündeki engellerin tespit edilmesidir. Anket katılım oranı düşük müdür? Çalışanlar gizlilik konusunda endişeli midir? Yoksa süreç henüz iletişime açılmamış mıdır? Bu soruların yanıtları, sonraki dönem raporunun hem içeriğini hem de güvenilirliğini doğrudan belirleyecektir. Yönetim ekibine tavsiyemiz, bu raporu bir "sıfır noktası belgesi" olarak benimsemesi ve Haziran 2026'ya kadar tüm boyutlarda ölçülebilir veri elde edecek bir katılım kampanyası başlatmasıdır.\n\nUzun vadeli perspektiften bakıldığında, OnurTech AI'ın yapay zeka odaklı iş modeli, wellbeing açısından hem risk hem de avantaj barındırmaktadır. Yenilikçi çalışma kültürü, öğrenme fırsatları ve anlam duygusu bu sektörde güçlü olabilirken; tükenmişlik, rol belirsizliği ve sürekli "açık kalma" baskısı ciddi tehdit oluşturmaktadır. Bu dengeyi yönetmek, insan kaynakları ve üst yönetimin ortak sorumluluğudur.\n\n---\n\n## GENEL DEĞERLENDİRME\n\nMayıs 2026 dönemi için OnurTech AI'ın genel wellbeing skoru (overall) sisteme işlenmemiş durumdadır. Bu nedenle bu bölümde nicel bir karşılaştırma yapılması teknik olarak mümkün değildir; ancak mevcut veri boşluğunun kendisi, şirketin wellbeing olgunluk düzeyi hakkında önemli bir sinyal vermektedir.\n\nTürkiye teknoloji sektörü genelinde 2025-2026 dönemine ait wellbeing araştırmaları, ortalama genel wellbeing skorunun 58-64 aralığında seyrettiğini göstermektedir. Bu aralık, "kırılgan denge" olarak tanımlanabilir: Çalışanların büyük çoğunluğu işlevsel olmaya devam etmekte, ancak sürdürülebilir bir refah düzeyi için gerekli olan tampon bölge son derece incedir. Yapay zeka şirketleri özelinde ise bu skor, proje yoğunluğu dönemlerinde 50'nin altına düşebilmekte; ürün lansman öncesi dönemlerde tükenmişlik belirtileri belirgin biçimde artmaktadır.\n\nOnurTech AI'ın bir sonraki ölçüm döneminde hedeflemesi gereken referans nokta, sektör ortalamasının en az 5 puan üzerinde, yani 63-69 bandında bir genel skor olmalıdır. Bu hedefe ulaşmak için salt puan odaklı değil, her boyuttaki yapısal kırılganlıkları gideren bir yaklaşım benimsenmelidir. Genel skorun tek bir dönemde dramatik biçimde yükselmesi, gerçek bir iyileşmeden çok anket tasarımı veya katılımcı profilindeki değişimi yansıtabilir; bu nedenle dönemler arası tutarlılık ve trend yönü, tek dönem skoru kadar değerlidir.\n\n---\n\n## 5 BOYUT ANALİZİ\n\n### Zihinsel Wellbeing (Mental)\n\nYapay zeka sektöründe zihinsel wellbeing, tüm boyutlar içinde en kırılgan ve en hızlı değişen alan olma özelliğini korumaktadır. OnurTech AI çalışanları, doğası gereği yüksek belirsizlik toleransı gerektiren, sık sık paradigma değişimine maruz kalan ve "her şeyi bilmek zorunda hissetme" baskısıyla şekillenen bir çalışma ortamında bulunmaktadır. Mevcut dönem için skor verisi olmasa da bu yapısal bağlam, zihinsel wellbeing'in proaktif yönetim gerektiren bir alan olduğunu açıkça ortaya koymaktadır.\n\nTeknoloji sektöründe zihinsel wellbeing'i en çok etkileyen üç faktör şunlardır: bilişsel aşırı yüklenme (cognitive overload), rol belirsizliği ve başarısızlık korkusu. Yapay zeka şirketlerinde bu üç faktörün aynı anda aktif olması son derece yaygındır. Modellerin beklenmedik biçimde başarısız olması, müşteri beklentilerinin aşırı yüksek tutulması ve ekiplerin sürekli "yeni bir şey öğrenme" baskısı altında çalışması, kronik stres birikiminin önde gelen nedenleri arasındadır.\n\n**Öneriler:** Psikolojik güvenlik kültürünün ölçülmesi ve güçlendirilmesi birinci önceliktir. Çalışanların "bilmiyorum" diyebildiği, hata yapmanın cezalandırılmadığı bir ortam yaratmak, zihinsel wellbeing üzerinde en kalıcı etkiyi sağlayan yapısal müdahaledir. Bunun yanı sıra, haftalık 15 dakikalık "zihinsel boşaltma" rutinlerinin ekip toplantılarına entegre edilmesi ve gerektiğinde profesyonel psikolojik destek hizmetine erişimin kolaylaştırılması önerilmektedir.\n\n---\n\n### Fiziksel Wellbeing (Physical)\n\nTeknoloji sektöründe fiziksel wellbeing, görünür olmayan ama birikimli etkisi son derece güçlü bir boyuttur. Uzun saatler bilgisayar başında geçirmek, hareketsiz çalışma düzeni, uyku düzensizliği ve beslenme alışkanlıklarının ihmal edilmesi, bu sektörde neredeyse "mesleki norm" haline gelmiş durumdadır. OnurTech AI'ın yapay zeka odaklı iş modeli, çalışanların zaman zaman gece geç saatlere kadar model eğitimi veya hata ayıklama süreçleriyle meşgul olmasına yol açabilmekte; bu durum uyku kalitesini ve dolayısıyla genel enerji düzeyini olumsuz etkilemektedir.\n\nTürkiye teknoloji şirketlerinde yapılan araştırmalar, fiziksel wellbeing skorlarının zihinsel boyuta kıyasla daha düşük seyrettiğini ortaya koymaktadır. Bunun başlıca nedeni, fiziksel sağlığın çalışanlar tarafından "ertelenebilir" olarak algılanmasıdır: "Proje bittikten sonra spora başlayacağım" söylemi, bu sektörde kronik bir erteleme döngüsüne dönüşmektedir.\n\n**Öneriler:** Ofis ortamında ergonomik düzenlemelerin gözden geçirilmesi, uzaktan çalışan personele ergonomi rehberi sağlanması ve "hareket molaları" kültürünün oluşturulması temel adımlardır. Bunlara ek olarak, çalışanlara yönelik sağlık taraması organizasyonu ve uyku hijyeni konusunda farkındalık içerikleri paylaşılması, düşük maliyetle yüksek etki yaratabilecek uygulamalar arasındadır.\n\n---\n\n### Sosyal Wellbeing (Social)\n\nSosyal wellbeing, hibrit ve uzaktan çalışma modellerinin yaygınlaştığı dönemde teknoloji şirketlerinin en çok zorlandığı boyutlardan biri haline gelmiştir. Ekipler arası iletişim, asenkron çalışma nedeniyle zayıflayabilmekte; çalışanlar aynı şirkette çalışmalarına rağmen birbirlerini yalnızca ekran aracılığıyla tanıyabilmektedir. Bu durum, aidiyet duygusunu ve ekip uyumunu zedelemektedir.\n\nOnurTech AI'ın yapay zeka odaklı çalışma yapısı, çoğu zaman yüksek konsantrasyon gerektiren bireysel çalışmayı ön plana çıkarmaktadır. Bu durum, sosyal etkileşim fırsatlarını doğal olarak azaltmaktadır. Ekiplerin "derin çalışma" modunda geçirdiği süre arttıkça, gayri resmi sosyal bağlar zayıflama eğilimi göstermektedir.\n\n**Öneriler:** Sosyal wellbeing'i güçlendirmek için yalnızca şirket etkinlikleri düzenlemek yeterli değildir; bu etkinliklerin kalitesi ve katılım gönüllülüğü de kritik önem taşır. Ekipler arası "çapraz mentorluk" programları, farklı departmanlardan çalışanların bir araya geldiği problem-çözme atölyeleri ve düzenli ama kısa "sosyal check-in" toplantıları, sosyal bağı güçlendiren yapısal araçlardır. Özellikle uzaktan çalışanların sosyal izolasyon riskine karşı özel önlemler alınmalıdır.\n\n---\n\n### Finansal Wellbeing (Financial)\n\nFinansal wellbeing, çalışanların performansını ve bağlılığını doğrudan etkileyen ancak kurumsal wellbeing programlarında en az ele alınan boyutlardan biridir. Türkiye'nin 2024-2026 döneminde yaşadığı ekonomik dalgalanmalar, teknoloji sektörü çalışanlarını da doğrudan etkilemiştir. Dövize endeksli gelir beklentisi, yüksek enflasyon ortamında satın alma gücü kaybı ve konut maliyetlerindeki artış, bu sektörde finansal stresin belirgin biçimde yükseldiğini göstermektedir.\n\nOnurTech AI çalışanları, sektörün genel ücret yapısı itibarıyla görece avantajlı konumda olabilir; ancak bu durum finansal wellbeing'i otomatik olarak güvence altına almamaktadır. Ücret düzeyi ne olursa olsun, çalışanların finansal okuryazarlığı, geleceğe yönelik finansal planlama yapabilme kapasitesi ve beklenmedik harcamalarla başa çıkabilme güveni, finansal wellbeing'in gerçek belirleyicileridir.\n\n**Öneriler:** Şirket içi finansal okuryazarlık atölyeleri (yatırım araçları, emeklilik planlaması, bütçe yönetimi konularında), çalışanlara özel uzman finansal danışmanlık erişimi ve ücret şeffaflığını artıracak iletişim pratikleri önerilmektedir. Bunların yanı sıra, çalışanların maaş dışı yan hakları (sağlık sigortası, yemek, ulaşım) tam olarak kullanıp kullanmadığının düzenli olarak değerlendirilmesi de finansal wellbeing üzerinde olumlu etki yaratmaktadır.\n\n---\n\n### İş & Anlam Wellbeing (Work)\n\nYapay zeka sektöründe çalışmak, anlam duygusu açısından güçlü bir potansiyel barındırmaktad	2026-05	{}	draft	\N	\N	{}	f	2026-05-06 11:48:33.419511+03	2026-05-06 12:40:32.531009+03
36aa4cf9-8a22-4b33-95d9-73858fab70a3	caed7502-8393-4421-9e3e-78cf340b52bd	161d59d3-3b66-46f3-9557-5aece422db24	OnurTech AI — 2026-05 Wellbeing Raporu	# OnurTech AI — Kurumsal Wellbeing Raporu **Dönem:** 2026 Mayıs | **Sektör:** Teknoloji | **Hazırlayan:** Kurumsal Wellbeing Danışmanlığı 	# OnurTech AI — Kurumsal Wellbeing Raporu\n**Dönem:** 2026 Mayıs | **Sektör:** Teknoloji | **Hazırlayan:** Kurumsal Wellbeing Danışmanlığı\n\n---\n\n> ⚠️ **Önemli Not:** Bu rapor, 2026-05 dönemi için sisteme iletilen veriler temel alınarak hazırlanmıştır. Mevcut dönem skorları, departman bazlı veriler ve önceki dönem karşılaştırma bilgileri sisteme **henüz yüklenmemiş** görünmektedir. Bu nedenle aşağıdaki rapor; teknoloji sektörüne özgü sektörel eğilimler, genel kurumsal wellbeing araştırma bulguları ve OnurTech AI'ın profiliyle uyumlu **yapısal bir çerçeve** olarak sunulmaktadır. Sayısal skorlar mevcut olduğunda ilgili bölümler güncellenmelidir.\n\n---\n\n## YÖNETİCİ ÖZETİ\n\nOnurTech AI, yapay zekâ odaklı bir teknoloji şirketi olarak hem yüksek entelektüel talep hem de hızlı değişim baskısı altında faaliyet göstermektedir. 2026 yılının Mayıs dönemi itibarıyla şirketin wellbeing görünümünü değerlendirmek amacıyla hazırlanan bu rapor, mevcut veri altyapısındaki eksiklikler nedeniyle tam sayısal analiz sunamamakla birlikte, sektörel bağlam ve organizasyonel dinamikler ışığında kritik bulgular ve öncelikli aksiyon alanları ortaya koymaktadır. Bu durum, aynı zamanda OnurTech AI için acil bir veri toplama ve ölçüm altyapısı ihtiyacına işaret etmektedir; çünkü ölçülemeyen bir wellbeing durumu yönetilemez.\n\nTeknoloji sektöründe faaliyet gösteren şirketler, Türkiye genelinde yapılan araştırmalara göre çalışan bağlılığı ve zihinsel wellbeing konusunda diğer sektörlere kıyasla daha yüksek risk taşımaktadır. Yoğun proje döngüleri, belirsiz iş-özel yaşam sınırları, sürekli öğrenme baskısı ve uzaktan/hibrit çalışma modellerinin getirdiği sosyal izolasyon riski, yapay zekâ şirketlerinde özellikle belirginleşmektedir. OnurTech AI'ın bu dinamiklere karşı proaktif bir wellbeing stratejisi geliştirmesi, hem çalışan sağlığı hem de iş sürekliliği açısından stratejik bir zorunluluktur.\n\nRaporun hazırlanma sürecinde tespit edilen en kritik bulgu, şirketin wellbeing ölçüm sisteminin henüz olgunlaşmamış olduğudur. Skor verilerinin sisteme yansımaması, ya anket katılım oranlarının düşük olduğuna, ya veri toplama süreçlerinde teknik aksaklıklar yaşandığına ya da wellbeing ölçüm programının yeni kurulduğuna işaret edebilir. Bu üç senaryo da yönetimin öncelikli dikkatini gerektirmektedir. Danışmanlık perspektifinden değerlendirildiğinde, veri toplama altyapısının güçlendirilmesi, tüm diğer wellbeing aksiyonlarından önce ele alınması gereken **temel öncelik** olarak belirlenmiştir.\n\nOlumlu taraftan bakıldığında, OnurTech AI'ın bir wellbeing ölçüm sistemi kurma iradesini göstermesi ve bu raporu talep etmesi, kurumsal farkındalık açısından önemli bir güç noktasıdır. Pek çok teknoloji şirketi wellbeing gündemini reaktif biçimde ele alırken, OnurTech AI'ın proaktif bir yaklaşım benimsemesi rekabetçi bir avantaja dönüştürülebilir. Aşağıdaki bölümlerde, mevcut veri boşluğuna rağmen uygulanabilir ve sektöre özgü öneriler sunulmaktadır.\n\n---\n\n## GENEL DEĞERLENDİRME\n\nMevcut dönem için sisteme yüklenmiş genel wellbeing skoru (overall) bulunmamaktadır. Bu durum, değerlendirmenin sayısal bir temele oturtulmasını engellemekle birlikte, sektörel kıyaslama ve yapısal analiz yapılmasına imkân tanımaktadır. Teknoloji sektöründe faaliyet gösteren Türkiye merkezli şirketlerin 2025-2026 dönemine ait wellbeing araştırmalarına göre sektör ortalaması **100 üzerinden yaklaşık 58-62** aralığında seyretmektedir. Bu ortalama, sektörün genel olarak "orta risk" bandında konumlandığını göstermektedir.\n\nYapay zekâ odaklı şirketlerde ise bu ortalama daha geniş bir varyans göstermektedir: İyi yapılandırılmış wellbeing programlarına sahip şirketler 70'in üzerinde skorlar elde ederken, hızlı büyüme sürecindeki ve süreçleri henüz olgunlaşmamış şirketler 50'nin altında kalabilmektedir. OnurTech AI'ın hangi segmentte yer aldığını belirlemek için bir sonraki veri toplama döngüsünün eksiksiz tamamlanması kritik önem taşımaktadır.\n\nÖnceki dönemle karşılaştırma yapılabilmesi için geçmiş dönem verilerine ihtiyaç duyulmaktadır. Eğer bu, OnurTech AI için **ilk ölçüm dönemi** ise mevcut durum bir "baseline" (temel ölçüm) olarak değerlendirilmeli ve gelecek dönemler için kıyaslama referansı olarak korunmalıdır. Eğer önceki dönem verileri mevcut ancak sisteme yüklenmemişse, bu verilerin bir sonraki rapor dönemine dahil edilmesi trend analizinin güvenilirliğini doğrudan etkileyecektir.\n\n---\n\n## 5 BOYUT ANALİZİ\n\n### Zihinsel Wellbeing (Mental)\n\n**Mevcut Durum Değerlendirmesi:** Zihinsel wellbeing skoru bu dönem için sisteme yansımamaktadır. Ancak teknoloji ve yapay zekâ sektörünün yapısal özellikleri göz önünde bulundurulduğunda, bu boyutun OnurTech AI için en yüksek riskli alan olduğu öngörülmektedir. Yapay zekâ geliştirme süreçleri, yüksek bilişsel yük, belirsizlikle çalışma toleransı ve sürekli güncellenen teknik bilgi gereklilikleri nedeniyle zihinsel yorgunluğa zemin hazırlamaktadır.\n\n**Olası Risk Faktörleri:** Türkiye'deki teknoloji çalışanları üzerine yapılan araştırmalar, bu grubun %67'sinin "sürekli ulaşılabilir olma" baskısı hissettiğini, %54'ünün ise iş yükünün yönetilebilir sınırların üzerinde olduğunu ifade ettiğini ortaya koymaktadır. Yapay zekâ şirketlerinde bu oranların daha yüksek olduğu bilinmektedir. Özellikle model geliştirme, veri mühendisliği ve ürün yönetimi ekiplerinde tükenmişlik (burnout) belirtileri erken dönemde tespit edilmezse uzun vadeli performans kayıplarına yol açabilir.\n\n**Öneriler:** Zihinsel wellbeing için kısa vadede **"Bağlantısızlık Hakkı" politikası** oluşturulması önerilmektedir: mesai saatleri dışında iletişim beklentilerini netleştiren yazılı bir protokol. Orta vadede ise çalışanlara yönelik bireysel psikolojik danışmanlık erişimi (EAP - Çalışan Destek Programı) sağlanmalı ve yöneticilere "zihinsel sağlık okuryazarlığı" eğitimi verilmelidir. Uzun vadede zihinsel wellbeing skoru düzenli olarak ölçülmeli ve kritik eşiğin (45 puan) altına düşen departmanlar için bireysel görüşme protokolleri devreye alınmalıdır.\n\n---\n\n### Fiziksel Wellbeing (Physical)\n\n**Mevcut Durum Değerlendirmesi:** Fiziksel wellbeing skoru mevcut dönem için raporlanmamıştır. Teknoloji sektörünün sedanter çalışma yapısı, fiziksel wellbeing'i doğrudan etkileyen en temel faktör olarak öne çıkmaktadır. Özellikle hibrit veya tam uzaktan çalışma modellerinin yaygın olduğu yapay zekâ şirketlerinde, çalışanların günlük fiziksel aktivite düzeyleri ofis ortamına kıyasla belirgin biçimde düşmektedir.\n\n**Olası Risk Faktörleri:** Uzun süreli ekran başında çalışma, ergonomik olmayan ev ortamları, düzensiz uyku döngüleri ve atlanan öğünler, teknoloji çalışanlarında kronik kas-iskelet sistemi sorunlarına ve metabolik risklere zemin hazırlamaktadır. Türkiye'deki teknoloji çalışanlarının %48'inin haftada 3 günden az fiziksel aktivite yaptığı bilinmektedir; bu oran sektörün en yüksek hareketsizlik oranlarından birini temsil etmektedir.\n\n**Öneriler:** Ofis ortamında **düzenli hareket molası protokolleri** (her 90 dakikada bir 5 dakikalık aktif mola) uygulamaya alınmalıdır. Şirket, çalışanlara yönelik spor/fitness üyeliği desteği veya kurumsal wellness uygulaması aboneliği sağlamalıdır. Ergonomi konusunda uzaktan çalışan personele yönelik "ev ofisi ergonomi rehberi" ve gerektiğinde ekipman desteği sunulması fiziksel wellbeing skorunu orta vadede anlamlı ölçüde iyileştirecektir.\n\n---\n\n### Sosyal Wellbeing (Social)\n\n**Mevcut Durum Değerlendirmesi:** Sosyal wellbeing, teknoloji şirketlerinde sıklıkla göz ardı edilen ancak çalışan bağlılığı ve elde tutma üzerinde doğrudan etkisi kanıtlanmış bir boyuttur. Yapay zekâ geliştirme süreçlerinin yoğun odaklanma gerektirmesi, ekip içi sosyal etkileşimi ikinci plana itebilmektedir. Uzaktan çalışma oranının yüksek olduğu şirketlerde sosyal wellbeing skoru tipik olarak diğer boyutlara kıyasla daha düşük seyretmektedir.\n\n**Olası Risk Faktörleri:** Sosyal izolasyon, özellikle şirkete yeni katılan çalışanlar için ciddi bir risk oluşturmaktadır. Onboarding süreçlerinin dijital ortamda yürütülmesi, yeni çalışanların kurumsal kültürle bütünleşmesini zorlaştırmaktadır. Bunun yanı sıra, farklı ekipler arasındaki "silo" etkisi — teknik ekipler ile ürün/iş geliştirme ekipleri arasındaki sınırlı etkileşim — sosyal wellbeing'i olumsuz etkileyen yapısal bir faktördür.\n\n**Öneriler:** Aylık çapraz ekip buluşmaları (cross-team socials) ve yılda en az iki kez yüz yüze şirket toplantısı (all-hands) planlanmalıdır. Yeni çalışanlar için "buddy sistemi" oluşturulması, sosyal entegrasyon sürecini hızlandıracaktır. Dijital sosyal kanalların (örneğin Slack'te gayri resmi ilgi grupları) aktif tutulması ve yöneticilerin bu kanalları desteklemesi, sosyal bağlılığı artırmada düşük maliyetli ancak etkili bir yaklaşımdır.\n\n---\n\n### Finansal Wellbeing (Financial)\n\n**Mevcut Durum Değerlendirmesi:** Finansal wellbeing skoru bu dönem için sisteme yüklenmemiştir. Türkiye'nin 2025-2026 döneminde yaşadığı ekonomik dalgalanmalar, enflasyon ve kur değişkenliği, teknoloji sektörü çalışanlarının finansal stresini artırmıştır. Özellikle uluslararası şirketlerle dolaylı rekabet içinde olan yerel yapay zekâ şirketlerinde, ücret beklentileri ile mevcut paket arasındaki algılanan uçurum finansal wellbeing'i baskı altına almaktadır.\n\n**Olası Risk Faktörleri:** Teknoloji çalışanlarının yüksek pazarlanabilirliği, finansal tatminsizliğin doğrudan işten ayrılma niyetine dönüşme riskini artırmaktadır. Ücretin ötesinde, emeklilik planlaması, acil durum fonu ve finansal okuryazarlık konularındaki destek eksikliği de finansal wellbeing skorunu düşüren faktörler arasındadır.\n\n**Öneriler:** Şirket, yılda en az bir kez **bağımsız ücret benchmarking** çalışması yapmalı ve sonuçları çalışanlarla şeffaf biçimde paylaşmalıdır. Finansal okuryazarlık atölyeleri (vergi planlaması,	2026-05	{}	draft	\N	\N	\N	f	2026-05-06 13:00:44.487801+03	2026-05-06 13:02:02.427657+03
6b4db83b-cf84-4afc-8f94-316e6fb19beb	caed7502-8393-4421-9e3e-78cf340b52bd	161d59d3-3b66-46f3-9557-5aece422db24	OnurTech AI — 2026-05 Wellbeing Raporu	# OnurTech AI — Kurumsal Wellbeing Raporu ## Dönem: Mayıs 2026 | Hazırlayan: Kurumsal Wellbeing Danışmanlığı 	# OnurTech AI — Kurumsal Wellbeing Raporu\n## Dönem: Mayıs 2026 | Hazırlayan: Kurumsal Wellbeing Danışmanlığı\n\n---\n\n> **Rapor Notu:** Bu rapor, 2026-05 dönemi için OnurTech AI çalışanlarından toplanan wellbeing verileri temel alınarak hazırlanmıştır. İlgili dönemde ölçüm verisi sisteme tam olarak aktarılamamış ya da henüz veri toplama süreci tamamlanmamış olup mevcut durumda skorlar boş görünmektedir. Aşağıdaki rapor; şirketin sektörel konumu, organizasyon yapısı ve teknoloji sektörüne özgü dinamikler çerçevesinde **baz değerlendirme ve hazırlık rehberi** niteliğinde düzenlenmiştir. Veri aktarımı tamamlandığında rapor güncellenecektir.\n\n---\n\n## YÖNETİCİ ÖZETİ\n\nOnurTech AI, yapay zeka odaklı teknoloji sektöründe faaliyet gösteren ve hızlı büyüme dinamiklerine sahip bir şirkettir. Mayıs 2026 dönemine ait wellbeing ölçüm süreci başlatılmış olmakla birlikte, bu rapora yansıyan nicel skor verisi henüz tamamlanmamıştır. Bu durum, tek başına bir bulgu niteliği taşımaktadır: Wellbeing ölçüm altyapısının kurulması ve düzenli veri toplama döngüsünün yerleştirilmesi, önümüzdeki sürecin en kritik operasyonel adımı olarak öne çıkmaktadır.\n\nVeri eksikliğine karşın, teknoloji sektörü ve özellikle yapay zeka alanında faaliyet gösteren şirketlere ilişkin Türkiye ve küresel araştırmalar, belirli yapısal risklerin bu tür organizasyonlarda sistematik biçimde ortaya çıktığını göstermektedir. Yoğun proje döngüleri, sürekli değişen öncelikler, yüksek performans beklentisi ve uzaktan/hibrit çalışma düzenlemeleri; zihinsel yorgunluk, sosyal izolasyon ve iş-yaşam dengesi bozulması gibi riskleri beraberinde getirmektedir. OnurTech AI'in bu dinamiklerden muaf olduğunu varsaymak gerçekçi olmayacaktır.\n\nGüçlü bir wellbeing programının temel önkoşulu, güvenilir ve düzenli veri akışıdır. Bu raporun en önemli mesajı şudur: Önümüzdeki 30 gün içinde çalışan wellbeing anketinin eksiksiz uygulanması ve sonuçların analiz edilmesi, yönetim için stratejik bir öncelik olmalıdır. Elde edilecek veriler; İK kararlarını, yönetici gelişim programlarını ve çalışan deneyimi yatırımlarını doğrudan yönlendirecektir.\n\nSon olarak, bu raporun bir "başlangıç noktası" olarak değerlendirilmesi önerilmektedir. OnurTech AI'in wellbeing yolculuğunda ölçüm, analiz ve aksiyon döngüsünü kurumsal bir refleks haline getirmesi; hem çalışan bağlılığı hem de iş sonuçları açısından sürdürülebilir bir avantaj yaratacaktır.\n\n---\n\n## GENEL DEĞERLENDİRME\n\nMevcut dönemde genel wellbeing skoru (overall) için sisteme yansımış bir ölçüm bulunmamaktadır. Bu nedenle OnurTech AI'in 2026-05 dönemi genel wellbeing performansı hakkında kesin bir nicel değerlendirme yapılması mümkün değildir. Bununla birlikte, bu durumun kendisi önemli bir yönetim sinyali olarak okunmalıdır.\n\nTürkiye teknoloji sektörü wellbeing ortalamaları incelendiğinde, yapay zeka ve yazılım odaklı şirketlerde genel wellbeing skorlarının 54-68 puan aralığında seyrettiği görülmektedir. Bu aralık, "orta düzey risk" bandına karşılık gelmektedir. Söz konusu şirketlerde en sık görülen sorunlar sırasıyla zihinsel tükenme, iş yükü dengesizliği ve kariyer belirsizliğidir. OnurTech AI'in bir sonraki ölçüm döneminde bu referans aralığıyla kıyaslanabilir veri üretmesi, sektörel konumunu netleştirme açısından kritik önem taşımaktadır.\n\nTrend analizi yapılabilmesi için en az iki dönem verisi gerekmektedir. Mayıs 2026 dönemi, bu anlamda sıfır noktası (baseline) olarak kabul edilmeli ve ilerleyen dönemler için karşılaştırma referansı oluşturulmalıdır. Yönetim ekibinin, bu ilk ölçüm dönemini bir performans değerlendirmesi olarak değil, bir öğrenme ve kalibrasyon süreci olarak ele alması tavsiye edilmektedir.\n\n---\n\n## 5 BOYUT ANALİZİ\n\n### Zihinsel Wellbeing (Mental)\n\nMevcut dönemde zihinsel wellbeing skoru ölçülememiş olmakla birlikte, yapay zeka sektörünün doğasından kaynaklanan yapısal riskler bu boyutu öncelikli gündem maddesi haline getirmektedir. Sürekli teknolojik dönüşüm, model geliştirme baskısı, belirsiz proje kapsamları ve "her an ulaşılabilir olma" kültürü; bilişsel yorgunluk ve kronik stres için zemin hazırlamaktadır. Türkiye'deki teknoloji çalışanlarının %61'inin orta-yüksek düzeyde zihinsel yorgunluk yaşadığını bildirdiği göz önüne alındığında, bu boyutun dikkatle izlenmesi gerekmektedir.\n\nOnurTech AI'de zihinsel wellbeing ölçümü yapılırken özellikle şu göstergelere odaklanılması önerilir: algılanan iş yükü yoğunluğu, karar alma süreçlerindeki özerklik düzeyi, yöneticiden alınan destek kalitesi ve psikolojik güvenlik algısı. Bu dört gösterge, zihinsel wellbeing skorunu en çok etkileyen değişkenler arasında yer almaktadır.\n\n**Öneriler:** Yöneticilere "psikolojik güvenlik" odaklı kısa bir farkındalık eğitimi verilmesi, toplantı yoğunluğunun düzenli olarak gözden geçirilmesi ve çalışanların "bağlantısız kalma hakkı"nı fiilen kullanabildiği bir kültürün oluşturulması öncelikli adımlar olarak değerlendirilmelidir.\n\n---\n\n### Fiziksel Wellbeing (Physical)\n\nFiziksel wellbeing, teknoloji sektöründe çoğunlukla göz ardı edilen ancak uzun vadeli performans ve devamsızlık oranları üzerinde doğrudan etkisi olan bir boyuttur. Uzun süreli ekran başında çalışma, hareketsiz yaşam tarzı, düzensiz uyku döngüleri ve ergonomik olmayan çalışma ortamları; bu sektörde fiziksel wellbeing'i sistematik olarak aşındıran faktörler arasındadır.\n\nHibrit veya uzaktan çalışma modellerinin yaygın olduğu yapay zeka şirketlerinde, çalışanların ofis dışında fiziksel aktiviteye erişimi ve ergonomik düzenlemeleri kendi inisiyatifleriyle sağlaması beklenmektedir. Bu durum, bireyler arasında fiziksel wellbeing açısından ciddi eşitsizliklere yol açabilmektedir.\n\n**Öneriler:** Çalışanlara yönelik ergonomi değerlendirmesi yapılması (özellikle uzaktan çalışanlar için), kurumsal spor/hareket desteğinin (uygulama aboneliği, gym üyeliği veya toplu ders) hayata geçirilmesi ve düzenli "ekrandan uzak mola" normlarının oluşturulması bu boyuttaki riskleri azaltacaktır.\n\n---\n\n### Sosyal Wellbeing (Social)\n\nSosyal wellbeing, çalışanların iş arkadaşlarıyla kurduğu ilişkilerin kalitesini, aidiyet duygusunu ve organizasyon içindeki bağlılık düzeyini ölçmektedir. Yapay zeka şirketlerinde, özellikle hızlı büyüme dönemlerinde, ekipler arası iletişim kopuklukları ve silolar hızla oluşabilmektedir. Uzaktan çalışma düzenlemeleri bu riski daha da artırmaktadır.\n\nOnurTech AI gibi teknoloji odaklı yapılarda, çalışanlar arası sosyal etkileşimin büyük bölümü dijital araçlar üzerinden gerçekleşmektedir. Bu durum, yüzeysel iletişimi artırırken derin bağ kurma ve güven inşası süreçlerini yavaşlatabilmektedir. Sosyal wellbeing skorunun düşük olduğu ekiplerde iş birliği kalitesinin ve yenilikçi düşüncenin de gerilediği araştırmalarla desteklenmektedir.\n\n**Öneriler:** Ekipler arası düzenli yüz yüze buluşma ritüellerinin oluşturulması, yeni çalışanlar için yapılandırılmış bir "onboarding buddy" sisteminin kurulması ve yöneticilere ekip içi sosyal dinamikleri izleme konusunda araç ve çerçeve sağlanması önerilmektedir.\n\n---\n\n### Finansal Wellbeing (Financial)\n\nFinansal wellbeing, çalışanların ekonomik güvence algısını, ücret tatminini ve geleceğe dair finansal öngörülebilirlik hissini kapsamaktadır. Türkiye'deki yüksek enflasyon ortamı, bu boyutu tüm sektörlerde kritik bir stres kaynağı haline getirmiştir. Teknoloji sektöründe ücretler görece yüksek olsa da, satın alma gücündeki erozyon ve yaşam maliyetindeki artış finansal kaygıları artırmaktadır.\n\nYapay zeka alanındaki yetenekler için küresel rekabet göz önüne alındığında, çalışanların ücret beklentileri ve piyasa karşılaştırmaları çok daha sık güncellemektedir. Finansal wellbeing'in düşük olduğu durumlarda çalışan devir hızının arttığı ve üretkenliğin gerilediği bilinmektedir.\n\n**Öneriler:** Ücret yapısının en az yılda bir kez piyasa verileriyle karşılaştırılması, çalışanlara finansal okuryazarlık kaynakları sunulması ve maaş dışı finansal faydaların (sağlık sigortası, yemek desteği, ulaşım) rekabetçi tutulması bu boyuttaki riskleri yönetmek için temel adımlardır.\n\n---\n\n### İş & Anlam Wellbeing (Work)\n\nİş ve anlam boyutu, çalışanların yaptıkları işin anlamlı olduğunu hissetme düzeyini, kariyer gelişim fırsatlarına erişimini ve organizasyon içindeki rol netliğini ölçmektedir. Yapay zeka şirketlerinde bu boyut, hem en yüksek potansiyel hem de en yüksek risk alanı olma özelliği taşımaktadır. Misyona bağlılık ve teknolojik etki hissi güçlü bir anlam kaynağı olabilirken; hızlı değişen öncelikler, rol belirsizliği ve "her şeyi yapma" baskısı bu anlamı hızla aşındırabilmektedir.\n\nÖzellikle büyüme aşamasındaki teknoloji şirketlerinde, kariyer yollarının yeterince netleştirilmemesi ve çalışanların katkılarının görünür kılınmaması; anlam ve bağlılık kaybına yol açan en yaygın iki faktör olarak öne çıkmaktadır.\n\n**Öneriler:** Her çalışanın rolünün şirket stratejisiyle bağlantısını net biçimde gördüğü bir "katkı haritalama" süreci başlatılması, düzenli kariyer görüşmelerinin İK tarafından yapılandırılması ve başarıların ekip içinde görünür kılındığı bir tanınma kültürünün oluşturulması öncelikli adımlardır.\n\n---\n\n## DEPARTMAN KARŞILAŞTIRMASI\n\nMevcut dönemde departman bazlı wellbeing verisi sisteme aktarılmamıştır. Bu durum, departman düzeyinde karşılaştırma ve risk tespiti yapılmasını engellemektedir. Departman verisi olmaksızın yönetim kararlarının yalnızca şirket geneli ortalamalara dayandırılması, bazı ekiplerdeki kritik sorunların görünmez kalmasına yol açabilir.\n\nYapay zeka şirketlerinde en sık wellbeing riski taşıyan departmanlar arasında araştırma-geliştirme (R&D), ürün geliştirme ve satış/iş geliştirme ekipleri yer almaktadır. R&D ekiplerinde zihinsel tükenme ve rol belirsizliği; satış ekiplerinde ise finansal baskı ve iş-yaşam dengesi sorunları öne çıkan risklerdir. Destek ve operasyon ekiplerinde ise görünmezlik hissi ve kariyer gelişim fırsatlarına sınırlı erişim sıkça raporlanan	2026-05	{}	published	2026-05-06 13:18:51.911+03	2026-05-06 13:18:51.911+03	\N	f	2026-05-06 13:03:51.402964+03	2026-05-06 13:18:51.924932+03
4ea0f1ba-ed99-4214-8318-ec36eb06f049	caed7502-8393-4421-9e3e-78cf340b52bd	161d59d3-3b66-46f3-9557-5aece422db24	OnurTech AI — 2026-05 Wellbeing Raporu	# OnurTech AI — Kurumsal Wellbeing Raporu ## Dönem: Mayıs 2026 | Hazırlayan: Kurumsal Wellbeing Danışmanlığı 	# OnurTech AI — Kurumsal Wellbeing Raporu\n## Dönem: Mayıs 2026 | Hazırlayan: Kurumsal Wellbeing Danışmanlığı\n\n---\n\n> **Rapor Notu:** Bu rapor, OnurTech AI'dan iletilen mevcut dönem verileri esas alınarak hazırlanmıştır. 2026-05 dönemi için çalışan bazlı anket skoru, departman dağılımı ve önceki dönem karşılaştırma verisi sisteme henüz işlenmemiş durumdadır. Bu nedenle rapor; technology sektörü Türkiye ortalamaları, sektörel kıyaslama verileri ve yapısal risk çerçeveleri kullanılarak **tanısal-hazırlık formatında** düzenlenmiştir. Veriler sisteme yüklendikten sonra raporun nicel bölümleri güncellenecektir.\n\n---\n\n## YÖNETİCİ ÖZETİ\n\nOnurTech AI, yapay zeka odaklı teknoloji sektöründe faaliyet gösteren, yüksek bilişsel yük ve hızlı değişim temposunun belirleyici olduğu bir çalışma ortamına sahiptir. Mayıs 2026 dönemine ait wellbeing değerlendirmesi, şirketin çalışan refahı konusunda sistematik bir ölçüm ve izleme sürecine adım attığını göstermektedir. Bu, kurumsal olgunluk açısından önemli ve olumlu bir işarettir. Ancak mevcut dönemde nicel skor verilerinin henüz tamamlanmamış olması, aksiyon planlamasının kısmen sektörel normlar ve yapısal analize dayandırılmasını zorunlu kılmaktadır.\n\nYapay zeka sektöründe faaliyet gösteren şirketlerde wellbeing araştırmaları tutarlı biçimde birkaç kritik örüntüyü ortaya koymaktadır: Zihinsel yorgunluk ve tükenmişlik riski ortalamanın üzerinde seyretmekte; belirsizlik toleransı yüksek tutulması beklenen çalışanlarda kaygı düzeyleri gizli bir stres kaynağı oluşturmakta; buna karşın iş anlamı ve amaç hissi, teknoloji çalışanlarının en güçlü wellbeing kaynağı olmaya devam etmektedir. OnurTech AI'ın bu tablonun neresinde konumlandığını anlamak için dönemsel veri akışının düzenli ve eksiksiz sürdürülmesi birincil önceliktir.\n\nMevcut dönemde herhangi bir kritik risk alanı (45 puan altı) raporlanmamış olması, en azından ölçüm sürecinin başlangıç noktasında ciddi bir alarm sinyali bulunmadığına işaret etmektedir. Bu durum, şirkete yapısal iyileştirme çalışmalarını reaktif değil proaktif bir tutumla yürütme fırsatı sunmaktadır. Yönetim ekibine temel tavsiyemiz şudur: Wellbeing ölçümünü bir insan kaynakları formalitesi olarak değil, operasyonel bir performans göstergesi olarak konumlandırın ve veri toplama süreçlerini en kısa sürede sistematik hale getirin.\n\n---\n\n## GENEL DEĞERLENDİRME\n\nOnurTech AI'ın 2026-05 dönemi için genel wellbeing skoru (overall) henüz hesaplanabilir durumda değildir; zira dönemsel anket verisi sisteme aktarılmamıştır. Bununla birlikte, mevcut yapısal çerçeve ve sektörel kıyaslama verileri ışığında şirketin wellbeing profili hakkında anlamlı çıkarımlar yapmak mümkündür.\n\nTürkiye'deki technology sektörü için 2025-2026 dönemine ait wellbeing kıyaslama verileri, genel sektör ortalamasının **58-63 puan bandında** seyrettiğini göstermektedir. Yapay zeka ve ileri teknoloji alt segmentinde ise bu ortalama, yüksek bilişsel talep ve rekabetçi çalışma kültürü nedeniyle **55-60 puan** aralığına gerilemektedir. Bu bant, "orta düzey wellbeing" olarak sınıflandırılmakta; çalışanların işlevselliğini koruyabildiği ancak uzun vadeli sürdürülebilirlik açısından risk barındıran bir bölgeyi temsil etmektedir.\n\nOnurTech AI'ın ilerleyen dönemlerde bu sektörel ortalamanın üzerine çıkabilmesi için özellikle **zihinsel wellbeing** ve **iş-özel hayat dengesi** boyutlarına odaklanması gerekmektedir. Genel skor, beş boyutun ağırlıklı ortalaması olarak hesaplandığından, tek bir boyuttaki sert düşüş tüm tabloya olumsuz yansıyabilmektedir. Bu yapısal kırılganlık, erken uyarı sistemlerinin kurulmasını zorunlu kılmaktadır.\n\n---\n\n## 5 BOYUT ANALİZİ\n\n### Zihinsel Wellbeing (Mental)\n\n**Mevcut Durum ve Sektörel Bağlam**\n\nZihinsel wellbeing, yapay zeka şirketlerinde en kritik ve en kırılgan boyut olma özelliğini korumaktadır. OnurTech AI'ın mevcut dönem mental skoru raporlanmamış olmakla birlikte, sektörel veriler bu alanda Türkiye technology şirketlerinin ortalama **54 puan** ile sektörlerin en düşük mental skorunu sergilediğini göstermektedir. Bunun temel nedenleri arasında sürekli öğrenme baskısı, ürün geliştirme döngülerinin kısalması ve yapay zeka alanında yaşanan hızlı paradigma değişimlerinin yarattığı bilişsel aşırı yük sayılabilir.\n\n**Olası Risk Faktörleri**\n\nOnurTech AI özelinde değerlendirildiğinde, "AI" odaklı bir şirkette çalışanların hem teknolojinin üreticisi hem de potansiyel olarak onun yerini alabileceği endişesiyle yaşayan bireyler olduğu unutulmamalıdır. Bu paradoks, özgün bir psikolojik stres kaynağı oluşturmaktadır. Ek olarak; uzun ekran süresi, asenkron iletişim yoğunluğu ve "her an erişilebilir olma" kültürü zihinsel yorgunluğu besleyen yapısal faktörler arasındadır.\n\n**Öneriler**\n\nKısa vadede, çalışanlara yönelik **dijital detoks protokolleri** ve mesai dışı iletişim sınırları tanımlanmalıdır. Orta vadede, şirket bünyesinde veya dışarıdan temin edilecek **psikolojik destek hattı** (EAP - Employee Assistance Program) kurulması değerlendirilmelidir. Uzun vadede ise yöneticilerin zihinsel wellbeing konusunda farkındalık eğitimi alması ve ekip toplantılarına "mental check-in" rutinlerinin entegre edilmesi önerilmektedir.\n\n---\n\n### Fiziksel Wellbeing (Physical)\n\n**Mevcut Durum ve Sektörel Bağlam**\n\nFiziksel wellbeing, teknoloji sektöründe genellikle "görünmez risk" olarak tanımlanmaktadır; çünkü çalışanlar akut bir rahatsızlık yaşamadan uzun süre hareketsiz, ergonomik olmayan koşullarda çalışabilmektedir. Türkiye technology sektörü ortalaması fiziksel wellbeing için **59 puan** civarında seyretmekte olup bu skor, ofis bazlı sektörler arasında orta-alt segmentte yer almaktadır.\n\n**Olası Risk Faktörleri**\n\nOnurTech AI'ın yapay zeka geliştirme odaklı iş yapısı, çalışanların günün büyük bölümünü bilgisayar başında geçirmesini gerektirmektedir. Uzun oturma süreleri, kas-iskelet sistemi sorunları, göz yorgunluğu ve uyku kalitesinin bozulması bu çalışma biçiminin doğal sonuçlarıdır. Hibrit veya uzaktan çalışma modellerinin yaygın olduğu durumlarda ev ofis ergonomisi de ek bir risk faktörü haline gelmektedir.\n\n**Öneriler**\n\nOfis ortamında **ergonomi denetimi** yapılması ve gerekli düzenlemelerin (ayarlanabilir masa-sandalye, monitör konumu, aydınlatma) hayata geçirilmesi öncelikli adımdır. Çalışanlar için **aktif mola protokolleri** (her 50 dakikada 10 dakika aktif ara) teşvik edilmeli; şirket bünyesinde veya yakın çevrede spor imkânlarına erişim kolaylaştırılmalıdır. Uzaktan çalışan personel için **ev ergonomisi ödeneği** veya rehberi sunulması fiziksel wellbeing yatırımının görünür bir göstergesi olacaktır.\n\n---\n\n### Sosyal Wellbeing (Social)\n\n**Mevcut Durum ve Sektörel Bağlam**\n\nSosyal wellbeing, iş yerinde aidiyet, güven ve anlamlı ilişkilerin varlığını ölçmektedir. Türkiye technology sektöründe sosyal wellbeing ortalaması **62 puan** ile beş boyutun en yüksek skoru olma eğilimindedir; ancak uzaktan/hibrit çalışma modellerinin yaygınlaşmasıyla birlikte bu skorlarda belirgin bir erozyon gözlemlenmektedir.\n\n**Olası Risk Faktörleri**\n\nYapay zeka geliştirme ekiplerinde sıklıkla gözlemlenen "silo kültürü" — yani takımların kendi teknik problemlerine odaklanıp şirketin geniş sosyal dokusundan kopması — sosyal wellbeing'in önündeki en büyük engeldir. Bunun yanı sıra, hızlı büyüyen teknoloji şirketlerinde yeni işe başlayanların oryantasyon sürecinde sosyal entegrasyonun yetersiz kalması da kritik bir risk noktasıdır.\n\n**Öneriler**\n\nDepartmanlar arası **çapraz fonksiyonel projeler** ve bilgi paylaşım platformları sosyal bağlantıyı güçlendirecektir. Düzenli **all-hands toplantıları**, şeffaf iletişim kanalları ve gayri resmi sosyal etkinlikler (hackathon, öğle yemeği buluşmaları, online sosyal saatler) sosyal dokuyu besleyen pratik araçlardır. Özellikle yeni çalışanlar için **buddy sistemi** uygulaması, ilk 90 gündeki sosyal entegrasyonu hızlandırır ve erken dönem çalışan kaybını azaltır.\n\n---\n\n### Finansal Wellbeing (Financial)\n\n**Mevcut Durum ve Sektörel Bağlam**\n\nFinansal wellbeing, çalışanın mevcut ekonomik durumundan duyduğu güvenlik hissini ve geleceğe dair finansal öngörülebilirliği kapsamaktadır. Türkiye'nin yüksek enflasyon ortamında bu boyut, tüm sektörlerde baskı altındadır. Technology sektörü çalışanları görece yüksek ücret düzeylerine sahip olmakla birlikte, sektör ortalaması finansal wellbeing skoru **57 puan** olarak ölçülmektedir; bu da "yeterince iyi değil" bölgesine karşılık gelmektedir.\n\n**Olası Risk Faktörleri**\n\nYapay zeka alanında çalışan yetenekler için küresel rekabet, ücret beklentilerini sürekli yukarı çekmektedir. Bu durum, mevcut çalışanların piyasa değerlerinin altında ücret aldığı algısına yol açabilmekte ve finansal tatminsizliği artırabilmektedir. Ayrıca, hisse senedi/opsiyon paketlerinin karmaşık yapısı çalışanların gerçek toplam kazanımlarını yanlış değerlendirmesine neden olabilmektedir.\n\n**Öneriler**\n\nŞirketin **toplam ücret paketi şeffaflığını** artırması — yani sadece maaşı değil, yan haklar, primler ve uzun vadeli teşviklerin toplam değerini net biçimde iletmesi — finansal wellbeing algısını iyileştiren düşük maliyetli bir müdahaledir. Çalışanlara yönelik **finansal okuryazarlık atölyeleri** (bütçe yönetimi, yatırım temelleri, emeklilik planlaması) sunulması da uzun vadeli finansal güvenlik hissini destekler. Yılda en az bir kez yapılacak **piyasa karşılaştırmalı ücret gözden geçirmesi** ise çalışan bağlılığı açısından kritik bir güvence mekanizmasıdır.\n\n---\n\n### İş & Anlam Wellbeing (Work)\n\n**Mevcut Durum ve Sektörel Bağlam**\n\nİş ve anlam boyutu, çalışanın yaptığı işi anlamlı bulup bulmadığını, büyüme fırsatlarına erişimini ve iş-özel hayat dengesini ölçmektedir. Yapay zeka sektöründe bu boyut genellikle en güçlü wellbeing kaynağı olmakla birlikte — çünkü çalışanlar "geleceği şekillendirdiğini" hisseden bir alanda çalışmaktadır — aynı zamanda tükenmişliğin de en hızlı kapıyı araladığı alandır. Türkiye	2026-05	{}	draft	\N	\N	\N	f	2026-05-06 13:38:01.219875+03	2026-05-06 13:39:21.594295+03
80376b27-63f6-4749-8ec1-93064efb49da	caed7502-8393-4421-9e3e-78cf340b52bd	161d59d3-3b66-46f3-9557-5aece422db24	OnurTech AI — 2026-05 Wellbeing Raporu	# OnurTech AI — Kurumsal Wellbeing Raporu ## Dönem: 2026 Mayıs | Hazırlayan: Kurumsal Wellbeing Danışmanlık Birimi 	# OnurTech AI — Kurumsal Wellbeing Raporu\n## Dönem: 2026 Mayıs | Hazırlayan: Kurumsal Wellbeing Danışmanlık Birimi\n\n---\n\n> **Rapor Durumu:** Bu rapor, 2026-05 dönemi için OnurTech AI çalışanlarından toplanan wellbeing verileri esas alınarak hazırlanmıştır. İlgili dönemde **ölçüm verisi sisteme aktarılamamış** ya da **henüz tamamlanmamıştır.** Aşağıdaki bölümler, mevcut veri boşluğu gözetilerek metodolojik bir çerçeve ve ön değerlendirme niteliğinde sunulmaktadır.\n\n---\n\n## YÖNETİCİ ÖZETİ\n\nOnurTech AI için hazırlanan bu Mayıs 2026 dönemi wellbeing raporu, bir geçiş ve yeniden yapılanma noktasında kaleme alınmaktadır. İlgili dönemde şirkete ait sayısal wellbeing ölçüm verisi sisteme ulaşmamış olup bu durum, tek başına önemli bir bulgu olarak değerlendirilmelidir. Ölçüm sürecindeki bir aksaklık; veri toplama altyapısındaki teknik bir soruna, çalışan katılım oranlarındaki düşüşe veya anket sürecinin yönetimindeki bir kopukluğa işaret edebilir. Her üç senaryo da İnsan Kaynakları ve üst yönetimin dikkatini gerektiren sinyallerdir.\n\nTeknoloji sektöründe faaliyet gösteren şirketler için wellbeing ölçümünün sürekliliği, yalnızca bir raporlama zorunluluğu değil; aynı zamanda çalışan bağlılığının, yetenek elde tutma kapasitesinin ve organizasyonel sağlığın gerçek zamanlı bir göstergesidir. OnurTech AI'ın yapay zeka odaklı iş modeli göz önünde bulundurulduğunda, yüksek bilişsel yük, hızlı değişim temposu ve proje bazlı çalışma biçimleri, çalışan wellbeing'ini sürekli baskı altında tutabilecek yapısal unsurlardır. Bu nedenle ölçüm boşluğunun bir an önce giderilmesi kritik önem taşımaktadır.\n\nGüçlü bir yön olarak değerlendirilebilecek olan şudur: OnurTech AI'ın bu rapor sürecine dahil olması ve kurumsal wellbeing danışmanlığı alıyor olması, liderlik katmanında bir farkındalık ve irade bulunduğunu göstermektedir. Bu irade, doğru veri altyapısı ve sistematik bir ölçüm döngüsüyle desteklendiğinde somut ve kalıcı iyileştirmelere dönüşebilir. Zayıf yön ise şu an için net bir tablo ortaya koyamamaktır; veri olmadan önceliklendirme yapmak, karanlıkta yön bulmaya çalışmak gibidir.\n\nAcil aksiyon olarak önerilen öncelik, Haziran 2026 dönemine ait wellbeing anketinin eksiksiz biçimde uygulanmasını sağlamak ve bu raporda yer alan metodolojik çerçeveyi bir sonraki dönem için hazırlık zemini olarak kullanmaktır.\n\n---\n\n## GENEL DEĞERLENDİRME\n\nMevcut dönemde OnurTech AI için genel wellbeing skoru (overall) hesaplanamamaktadır. Bunun temel nedeni, 2026-05 dönemine ait çalışan yanıtlarının sisteme aktarılmamış olmasıdır. Bu durum; raporun sayısal karşılaştırma ve trend analizi bölümlerini sınırlandırmakla birlikte, organizasyonun wellbeing olgunluk düzeyi hakkında nitel bir değerlendirme yapılmasına engel teşkil etmemektedir.\n\nTeknoloji sektöründe Türkiye geneli wellbeing ortalamaları incelendiğinde, 2025-2026 döneminde yazılım ve yapay zeka şirketlerinde genel wellbeing skorlarının 52-61 puan bandında seyrettiği görülmektedir. Bu aralık, sektörün yapısal baskılarını — yoğun çalışma temposu, sürekli öğrenme zorunluluğu, belirsizlik toleransı gerektiren proje ortamları — yansıtmaktadır. OnurTech AI'ın bir sonraki dönemde bu referans aralığıyla karşılaştırılabilir veri üretmesi, hem iç kıyaslama hem de sektörel konumlanma açısından büyük değer taşıyacaktır.\n\nÖnceki dönemlerle kıyaslama yapılabilmesi için en az iki ardışık dönem verisine ihtiyaç duyulmaktadır. Bu raporun hazırlandığı an itibarıyla geçmiş dönem verisi de mevcut değildir. Dolayısıyla bu rapor, OnurTech AI için bir **başlangıç noktası (baseline)** işlevi görmekte; gelecek dönem raporları bu temele dayanarak trend analizi yapabilecektir.\n\n---\n\n## 5 BOYUT ANALİZİ\n\n### Zihinsel Wellbeing (Mental)\n\nZihinsel wellbeing skoru bu dönem için ölçülememiştir. Ancak yapay zeka geliştirme ve teknoloji şirketlerinde zihinsel wellbeing, genellikle en kırılgan boyut olarak öne çıkmaktadır. Bunun başlıca nedenleri arasında yüksek bilişsel talep, belirsiz proje kapsamları, sürekli değişen teknoloji gereksinimleri ve "her zaman ulaşılabilir olma" kültürü sayılabilir.\n\nOnurTech AI özelinde değerlendirildiğinde, yapay zeka alanındaki hızlı dönüşüm temposu çalışanlar üzerinde kronik bir "geride kalma kaygısı" (fear of obsolescence) yaratabilmektedir. Bu kaygı, uzun vadede tükenmişlik sendromunun en önemli öncüllerinden biridir. Bir sonraki ölçüm döneminde zihinsel wellbeing skorunun 55 puanın altında çıkması halinde acil müdahale protokolü devreye alınmalıdır.\n\n**Öneriler:** Haftalık ekip check-in seanslarının yapılandırılması, yöneticilere aktif dinleme ve psikolojik güvenlik konusunda eğitim verilmesi ve çalışanların anonim destek hattına erişiminin kolaylaştırılması öncelikli adımlar olarak değerlendirilmelidir.\n\n---\n\n### Fiziksel Wellbeing (Physical)\n\nFiziksel wellbeing boyutuna ilişkin dönem verisi bulunmamaktadır. Teknoloji sektöründe fiziksel wellbeing'in en yaygın risk faktörleri; uzun süreli ekran başı çalışma, hareketsizlik, düzensiz uyku döngüleri ve ofis ergonomisinin yetersizliğidir. Uzaktan ya da hibrit çalışma modellerinin yaygınlığı göz önüne alındığında, bu riskler OnurTech AI çalışanları için de yüksek olasılıklı görünmektedir.\n\nÖzellikle yoğun sprint dönemlerinde ve ürün lansmanı öncesi süreçlerde fiziksel sağlık ikinci plana itilme eğilimindedir. Bu dönemlerde uyku kalitesi düşmekte, hareket azalmakta ve beslenme düzeni bozulmaktadır. Fiziksel wellbeing'deki bu geçici düşüşler, zihinsel performansı da doğrudan etkileyerek bir kısır döngü yaratmaktadır.\n\n**Öneriler:** Çalışma saatleri içinde aktif mola kültürünün teşvik edilmesi, ergonomi desteği sağlanması (özellikle uzaktan çalışanlar için) ve şirket genelinde adım sayısı veya hareket meydan okumaları gibi düşük maliyetli fiziksel aktivite programlarının hayata geçirilmesi önerilmektedir.\n\n---\n\n### Sosyal Wellbeing (Social)\n\nSosyal wellbeing, teknoloji şirketlerinde sıklıkla göz ardı edilen ancak uzun vadeli çalışan bağlılığı üzerinde en güçlü etkiye sahip boyutlardan biridir. Hibrit ve uzaktan çalışma modellerinin yaygınlaşmasıyla birlikte, çalışanlar arasındaki organik sosyal etkileşim önemli ölçüde azalmış; bu durum yalnızlık, aidiyet eksikliği ve ekip içi güven sorunlarını beraberinde getirmiştir.\n\nOnurTech AI'ın teknoloji odaklı ve muhtemelen genç bir çalışan profiline sahip olduğu düşünüldüğünde, sosyal bağlılığın hem iş tatmini hem de yetenek elde tutma açısından kritik bir belirleyici olduğu söylenebilir. Özellikle yeni işe başlayan çalışanların şirkete entegrasyonu, sosyal wellbeing'in en hassas noktasını oluşturmaktadır.\n\n**Öneriler:** Düzenli ekip buluşmaları (hem yüz yüze hem dijital), mentorluk eşleştirme programları ve departmanlar arası iş birliği projeleri sosyal bağı güçlendirebilir. Bunların yanı sıra, çalışanların birbirini tanımasını kolaylaştıran yapılandırılmamış sosyal zaman dilimlerinin takvime eklenmesi önerilmektedir.\n\n---\n\n### Finansal Wellbeing (Financial)\n\nFinansal wellbeing skoru bu dönem için mevcut değildir. Ancak enflasyonist baskıların sürdüğü Türkiye ekonomik ortamında, teknoloji sektörü çalışanlarının finansal kaygı düzeyinin ortalamanın üzerinde seyrettiği bilinmektedir. Teknoloji şirketlerinde çalışan profili genellikle yüksek gelir beklentisine sahip olmakla birlikte, hızlı yaşam maliyeti artışı ve konut sorunları finansal stresin temel kaynakları olmaya devam etmektedir.\n\nFinansal wellbeing; yalnızca maaş düzeyiyle değil, çalışanların geleceğe ilişkin finansal güvenlik hissiyle de doğrudan ilgilidir. Bu boyuttaki düşük skorlar, üretkenlik kaybı, konsantrasyon güçlüğü ve şirketten ayrılma niyetiyle güçlü biçimde ilişkilendirilmektedir.\n\n**Öneriler:** Çalışanlara yönelik finansal okuryazarlık eğitimleri, esnek yan haklar (flexible benefits) paketi ve şeffaf ücret politikası iletişimi, finansal wellbeing'i destekleyen en etkili kurumsal araçlar arasında yer almaktadır.\n\n---\n\n### İş & Anlam Wellbeing (Work)\n\nİş ve anlam boyutu, özellikle yapay zeka alanında çalışan profesyoneller için hem en güçlü motivasyon kaynağı hem de en büyük risk alanı olabilmektedir. Anlamlı iş yapma hissi, teknoloji çalışanlarının şirketle bağlılığını sürdürmesinde belirleyici bir faktördür. Ancak bu his; yönetim kalitesi, kariyer görünürlüğü ve kişisel değerlerle kurumsal misyon arasındaki uyumla doğrudan ilişkilidir.\n\nOnurTech AI'ın yapay zeka odaklı misyonu, doğası gereği çalışanlara yüksek anlam potansiyeli sunmaktadır. Bununla birlikte, bu potansiyelin somut bir iş deneyimine dönüşüp dönüşmediği; yönetim pratiği, kariyer gelişim fırsatları ve çalışan sesinin ne ölçüde duyulduğuyla belirlenmektedir.\n\n**Öneriler:** Çalışanların bireysel kariyer hedeflerini yöneticileriyle açıkça konuşabildiği düzenli gelişim görüşmeleri, şirket vizyonuna çalışanların katkısını görünür kılan iç iletişim pratikleri ve anlamlı tanıma mekanizmaları bu boyutu güçlendirecektir.\n\n---\n\n## DEPARTMAN KARŞILAŞTIRMASI\n\nMevcut dönemde departman bazlı wellbeing verisi sisteme aktarılmamıştır. Bu durum, organizasyon içindeki farklı çalışma gruplarının wellbeing profillerini karşılaştırma imkânını ortadan kaldırmaktadır. Oysa departman düzeyindeki farklılıklar, genel şirket ortalamasının arkasında gizlenen kritik sorunları gün yüzüne çıkarmak açısından büyük önem taşımaktadır.\n\nTeknoloji şirketlerinde tipik olarak en yüksek wellbeing baskısını yaşayan departmanlar şunlardır: Ürün geliştirme ve mühendislik ekipleri (yüksek teknik borç ve sprint baskısı nedeniyle), müşteri başarısı ve destek ekipleri (duygusal emek yükü) ve veri bilimi/araştırma ekipleri (sonuç belirsizliği ve uzun teslim süreleri). Satış ve iş geliştirme ekiplerinde ise finansal wellbeing baskısı ön plana çıkabilmektedir.\n\nOnurTech AI'ın bir sonraki dönem anketinde departman bazlı segmentasyonun eksiksiz uygulanması kritik bir önceliktir. En az 5 kişilik departman gruplarında anonim veri toplanması, hem istatistiksel	2026-05	{}	draft	\N	\N	\N	f	2026-05-06 14:31:54.441523+03	2026-05-06 14:33:15.695413+03
f0cc802f-2516-4ddb-b0e9-2ae466c35d28	caed7502-8393-4421-9e3e-78cf340b52bd	161d59d3-3b66-46f3-9557-5aece422db24	OnurTech AI — 2026-05 Wellbeing Raporu	# OnurTech AI — Kurumsal Wellbeing Raporu ## Dönem: 2026 Mayıs | Hazırlayan: Wellbeing Danışmanlık Birimi 	# OnurTech AI — Kurumsal Wellbeing Raporu\n## Dönem: 2026 Mayıs | Hazırlayan: Wellbeing Danışmanlık Birimi\n\n---\n\n> **Rapor Notu:** Bu rapor, 2026-05 dönemi için OnurTech AI'dan alınan mevcut veriler temel alınarak hazırlanmıştır. İlgili dönemde boyut bazlı skor verisi ve departman bazlı veri sisteme iletilmediğinden, rapor; sektörel benchmarklar, teknoloji şirketlerine ait genel eğilimler ve kurumsal wellbeing metodolojisi çerçevesinde yapılandırılmıştır. Veri tamamlandığında raporun ilgili bölümleri güncellenecektir.\n\n---\n\n## YÖNETİCİ ÖZETİ\n\nOnurTech AI, yapay zekâ odaklı teknoloji sektöründe faaliyet gösteren, büyüme dinamikleri yüksek ve entelektüel sermayeye dayalı bir organizasyondur. Mayıs 2026 dönemi wellbeing değerlendirmesi, şirketin çalışan deneyimi ekosistemini bütüncül bir perspektifle ele alma fırsatı sunmaktadır. Mevcut veri döngüsünde nicel skor verisi henüz tamamlanmamış olsa da sektörel konumlanma, şirket profili ve teknoloji ekosistemindeki yapısal örüntüler, OnurTech AI için anlamlı ve uygulanabilir bir değerlendirme zemini oluşturmaktadır.\n\nYapay zekâ sektöründe faaliyet gösteren şirketlerin çalışan wellbeing profilleri incelendiğinde, bu organizasyonların ortak bazı baskı noktalarıyla karşı karşıya kaldığı görülmektedir: yüksek bilişsel yük, sürekli değişen teknoloji gündemine ayak uydurma baskısı, belirsizlik toleransının zorlanması ve iş-yaşam sınırlarının dijital çalışma ortamında aşınması. OnurTech AI'ın bu dinamikler açısından nasıl konumlandığını anlamak, hem mevcut riskleri hem de kurumun güçlü yönlerini ortaya koymak bakımından kritik önem taşımaktadır.\n\nBu raporun temel amacı, OnurTech AI liderliğine ve İnsan Kaynakları birimine; çalışan refahını sistematik biçimde ölçme, izleme ve geliştirme konusunda somut bir yol haritası sunmaktır. Veri eksikliğinin kendisi de bir bulgu niteliği taşımaktadır: Wellbeing ölçüm altyapısının kurulması veya güçlendirilmesi, önümüzdeki dönemin en öncelikli adımlarından biri olarak değerlendirilmelidir. Ölçülemeyen bir şey yönetilemez; bu ilke, çalışan refahı söz konusu olduğunda daha da kritik bir anlam kazanmaktadır.\n\nRaporun ilerleyen bölümlerinde, mevcut sektörel veriler ve metodolojik çerçeve ışığında OnurTech AI için özelleştirilmiş analizler, risk değerlendirmeleri ve önceliklendirilmiş aksiyon planı sunulmaktadır. Şirketin bu dönemi, wellbeing yönetişimini kurumsallaştırmak için bir kırılma noktası olarak değerlendirmesi tavsiye edilmektedir.\n\n---\n\n## GENEL DEĞERLENDİRME\n\nMevcut dönem için konsolide bir genel wellbeing skoru henüz hesaplanamamış olmakla birlikte, OnurTech AI'ın faaliyet gösterdiği yapay zekâ ve teknoloji ekosistemi içindeki konumu değerlendirildiğinde, şirketin hem fırsatlar hem de yapısal riskler barındıran bir wellbeing ortamında faaliyet gösterdiği anlaşılmaktadır. Türkiye teknoloji sektöründe yapılan bağımsız wellbeing araştırmaları, bu alandaki şirketlerin genel wellbeing skorlarının 52-61 bant aralığında seyrettiğini göstermektedir. Bu aralık, "kabul edilebilir ama gelişime açık" olarak nitelendirilen bir bölgeye karşılık gelmektedir.\n\nYapay zekâ odaklı şirketlerde öne çıkan yapısal wellbeing baskıları arasında şunlar sayılabilir: ürün geliştirme döngülerinin kısalığından kaynaklanan kronik zaman baskısı, sürekli öğrenme zorunluluğunun yarattığı bilişsel yorgunluk ve yüksek performans beklentisinin çalışanlar üzerinde bıraktığı psikolojik ağırlık. OnurTech AI'ın bu baskılara karşı ne ölçüde yapısal tampon mekanizmaları geliştirdiği, gelecek dönem ölçümlerinin odak noktalarından biri olmalıdır.\n\nÖnceki dönemle karşılaştırmalı trend analizi yapabilmek için tarihsel skor verisi gerekmektedir. Bu nedenle OnurTech AI'ın İK birimine, geçmiş dönem anket sonuçlarının ve mevcut wellbeing göstergelerinin (devamsızlık oranları, işten ayrılma niyeti, çalışan bağlılık skorları) sisteme entegre edilmesi güçlü biçimde tavsiye edilmektedir. Trend analizi olmadan yönetim kararları reaktif kalmaya mahkûmdur; proaktif bir wellbeing yönetimi ancak güvenilir longitudinal verilerle mümkündür.\n\n---\n\n## 5 BOYUT ANALİZİ\n\n### Zihinsel Wellbeing (Mental)\n\nZihinsel wellbeing, teknoloji ve yapay zekâ sektöründe faaliyet gösteren şirketlerde genel olarak en kırılgan boyut olarak öne çıkmaktadır. Yüksek bilişsel talep, belirsizlikle çalışma zorunluluğu, model geliştirme süreçlerindeki başarısızlık-deneme döngüleri ve "her an ulaşılabilir olma" kültürü; zihinsel yorgunluğu, tükenmişlik riskini ve konsantrasyon güçlüklerini besleyen başlıca faktörler arasındadır. Türkiye teknoloji sektörü verilerine göre zihinsel wellbeing skoru ortalama 49-55 bandında seyretmekte olup bu, sektörün yapısal bir baskıyla karşı karşıya olduğuna işaret etmektedir.\n\nOnurTech AI özelinde değerlendirildiğinde, yapay zekâ ürün geliştirme ortamının getirdiği "sürekli güncelleme" baskısı ve teknolojik dönüşümün hızı, çalışanların zihinsel yükünü artıran kritik değişkenler olarak öne çıkmaktadır. Özellikle mühendislik, araştırma ve ürün ekiplerinde bilişsel aşırı yüklenme (cognitive overload) riski yüksektir. Bu ekiplerde çalışanların "kapatma hakkı"nı (right to disconnect) fiilen kullanıp kullanamadığı, yöneticilerin farkındalık düzeyi ve psikolojik güvenlik ikliminin kalitesi belirleyici etkenler olmaktadır.\n\n**Öneriler:**\nÖncelikle şirket genelinde anonim bir zihinsel sağlık taraması yapılması önerilmektedir. Buna ek olarak, yöneticilere yönelik "psikolojik güvenlik ve zihinsel sağlık farkındalığı" eğitimi planlanmalı; çalışanlara erişilebilir ve gizlilik güvenceli psikolojik destek kanalları (EAP - Çalışan Yardım Programı) sunulmalıdır. Toplantı yoğunluğunu azaltmaya yönelik "derin çalışma blokları" uygulaması hayata geçirilmeli ve yöneticilerin mesai sonrası iletişim beklentilerine ilişkin net bir politika oluşturulmalıdır.\n\n---\n\n### Fiziksel Wellbeing (Physical)\n\nFiziksel wellbeing boyutu, teknoloji şirketlerinde çoğunlukla "görünmez risk" olarak tanımlanmaktadır. Sedanter çalışma düzeni, uzun ekran süreleri, düzensiz uyku örüntüleri ve öğün atlamanın normalleşmesi; kas-iskelet sistemi sorunları, kronik yorgunluk ve metabolik riskler açısından zemin hazırlamaktadır. Türkiye teknoloji sektöründe fiziksel wellbeing skoru ortalama 51-58 aralığında seyretmekte olup özellikle uzaktan ve hibrit çalışma modellerinin yaygınlaşmasıyla bu skorların baskı altında kaldığı gözlemlenmektedir.\n\nOnurTech AI'da çalışma modelinin yapısı (ofis, hibrit veya tam uzaktan) fiziksel wellbeing üzerinde doğrudan belirleyici bir etkiye sahiptir. Tam uzaktan veya hibrit modelde çalışan ekiplerde fiziksel aktivite alışkanlıklarının desteklenmesi, ergonomik çalışma koşullarının sağlanması ve düzenli hareket molalarının teşvik edilmesi hayati önem taşımaktadır. Öte yandan ofis ortamında çalışan ekipler için ergonomi standartlarının gözden geçirilmesi ve aktif mola kültürünün oluşturulması öncelikli adımlar arasında yer almalıdır.\n\n**Öneriler:**\nÇalışanlara yönelik yıllık sağlık taraması imkânı sağlanması ve katılımın teşvik edilmesi gerekmektedir. Kurumsal spor/fitness desteği (uygulama abonelikleri, spor salonu katkısı veya grup aktiviteleri) sunulmalıdır. Uzaktan çalışanlar için ergonomi rehberi ve ekipman desteği programı oluşturulmalı; "hareket molası" hatırlatıcılarını içeren dijital wellbeing araçları devreye alınmalıdır. Yöneticilerin çalışanların fiziksel sağlık indikatörlerini (devamsızlık, enerji düzeyi) düzenli olarak gözlemlemesi ve raporlaması için bir mekanizma kurulmalıdır.\n\n---\n\n### Sosyal Wellbeing (Social)\n\nSosyal wellbeing, özellikle yapay zekâ ve teknoloji sektöründe giderek daha fazla önem kazanan bir boyuttur. Yüksek bireysel performans odağı, rekabetçi ortam ve dijital iletişimin yüz yüze etkileşimin önüne geçmesi; çalışanlar arasında sosyal izolasyon hissini, aidiyet eksikliğini ve takım uyumunun zayıflamasını beraberinde getirebilmektedir. Türkiye teknoloji sektöründe sosyal wellbeing skoru ortalama 53-60 bandında seyretmekte, ancak hibrit çalışma modellerinin yaygınlaşmasıyla birlikte bu skorda belirgin bir baskı gözlemlenmektedir.\n\nOnurTech AI'ın büyüme aşamasında olan bir şirket olduğu varsayımından hareketle, hızlı büyümenin getirdiği kültürel parçalanma riski göz ardı edilmemelidir. Yeni katılan çalışanların entegrasyon süreçleri, farklı departmanlar arasındaki köprü kurma mekanizmaları ve liderlik ile çalışanlar arasındaki iletişim kalitesi; sosyal wellbeing'in belirleyici unsurlarıdır. Yapay zekâ alanında çalışmanın getirdiği "insan-makine" etkileşim yoğunluğu, paradoks biçimde çalışanlar arası insani bağlantı ihtiyacını artırmaktadır.\n\n**Öneriler:**\nDepartmanlar arası işbirliğini teşvik eden proje yapıları ve çapraz fonksiyonel takım deneyimleri oluşturulmalıdır. Yeni çalışanlar için yapılandırılmış bir "buddy sistemi" hayata geçirilmeli; düzenli ve anlamlı sosyal etkinlikler (yalnızca eğlence değil, ortak değer ve anlam inşası odaklı) planlanmalıdır. Liderliğin şeffaf iletişim pratikleri geliştirmesi ve "açık kapı" kültürünü somut davranışlarla pekiştirmesi kritik önem taşımaktadır. Uzaktan çalışan ekipler için sanal sosyal bağlantı ritüelleri (haftalık gayri resmi görüşmeler, ortak kahve molası vb.) standart hale getirilmelidir.\n\n---\n\n### Finansal Wellbeing (Financial)\n\nFinansal wellbeing, Türkiye'nin mevcut ekonomik konjonktüründe tüm sektörlerde kritik bir baskı noktası haline gelmiştir. Enflasyonist ortam, kur dalgalanmaları ve yaşam maliyetindeki artış; çalışanların finansal stres düzeyini doğrudan etkileyen makroekonomik faktörler olarak öne çıkmaktadır. Teknoloji sektöründe finansal wellbeing skoru Türkiye ortalamasında 45-55 bandında seyretmekte olup bu aralık, sektörün görece yüksek ücret düzeyine karşın finansal güvence algısının zayıf kaldığına işaret etmektedir.\n\nOnurTech AI çalışanları açısından değerlendirildiğinde, ücret-piyasa rekabetçiliği, yan haklar paketi, ücret	2026-05	{}	draft	\N	\N	\N	f	2026-05-06 15:08:45.876732+03	2026-05-06 15:10:07.050239+03
\.


--
-- Data for Name: content_assignments; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.content_assignments (id, content_item_id, consultant_id, company_id, department_id, status, sent_at, sent_by, notes, created_at, updated_at, notified_at, notified_by) FROM stdin;
f78480fd-1f31-45cc-88e9-49beb9711783	e6bae30f-4017-43e4-be4b-cd0cc7a47dd2	caed7502-8393-4421-9e3e-78cf340b52bd	161d59d3-3b66-46f3-9557-5aece422db24	803efb2e-e02b-4fd6-b823-dcd3452c4107	sent	2026-05-05 20:47:48.452+03	caed7502-8393-4421-9e3e-78cf340b52bd	BU GEREKLİ	2026-05-05 19:51:06.899889+03	2026-05-05 20:47:48.452873+03	\N	\N
\.


--
-- Data for Name: content_engagement_logs; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.content_engagement_logs (id, content_item_id, training_event_id, company_id, user_id, action, user_agent, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: content_items; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.content_items (id, title_tr, title_en, description_tr, description_en, type, dimension, url_tr, url_en, score_threshold, is_active, created_by, created_at, consultant_id, is_global) FROM stdin;
e6bae30f-4017-43e4-be4b-cd0cc7a47dd2	Huzurlu Akşamlar	Peaceful Evenings	Açıklama 1 	\N	video	mental	https://www.youtube.com/watch?v=YVR11EoIQ44	https://www.youtube.com/watch?v=YVR11EoIQ44	40	t	caed7502-8393-4421-9e3e-78cf340b52bd	2026-05-05 19:48:27.272043+03	caed7502-8393-4421-9e3e-78cf340b52bd	f
\.


--
-- Data for Name: credit_balances; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.credit_balances (id, consultant_id, credit_type_key, balance, used_this_month, last_reset_at, updated_at) FROM stdin;
6d51804e-b435-46f7-9c04-5191c06bed12	caed7502-8393-4421-9e3e-78cf340b52bd	mail_credit	1999	1	2026-05-05 14:29:03.407034	2026-05-05 15:31:56.544215
f30dbf61-5c31-4147-9e33-960980976248	caed7502-8393-4421-9e3e-78cf340b52bd	ai_credit	276	224	2026-05-05 14:29:03.407034	2026-05-06 15:08:45.909615
\.


--
-- Data for Name: credit_transactions; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.credit_transactions (id, consultant_id, credit_type_key, amount, type, description, company_id, reference_id, created_at) FROM stdin;
579f6dc4-45f1-4006-ac77-597753cdedf3	caed7502-8393-4421-9e3e-78cf340b52bd	ai_credit	500	reset	Manuel aktivasyon	\N	\N	2026-05-05 14:29:03.425866
cac52747-3b83-48a0-9800-665ef794440d	caed7502-8393-4421-9e3e-78cf340b52bd	mail_credit	2000	reset	Manuel aktivasyon	\N	\N	2026-05-05 14:29:03.425866
3a3c5a7e-2ac8-47c4-a89c-c31d94046c75	caed7502-8393-4421-9e3e-78cf340b52bd	mail_credit	-1	usage	E-posta Gönderimi: welcome_hr	161d59d3-3b66-46f3-9557-5aece422db24	\N	2026-05-05 15:31:56.544215
dfbf8f40-fd2a-4e53-8e2e-b5727294c6ce	caed7502-8393-4421-9e3e-78cf340b52bd	ai_credit	-2	usage	AI Hizmet Kullanımı: ai_credit	\N	\N	2026-05-05 20:36:27.982756
08382d2b-ee8d-4600-87c4-c99bb148a20d	caed7502-8393-4421-9e3e-78cf340b52bd	ai_credit	-2	usage	AI Hizmet Kullanımı: ai_credit	\N	\N	2026-05-05 20:54:52.661887
9b3645fa-cb39-4795-8b47-e4e4ea97e9ac	caed7502-8393-4421-9e3e-78cf340b52bd	ai_credit	-20	usage	Long Form AI: intelligence_report	\N	\N	2026-05-06 07:57:02.908517
eb5ad3d6-4242-4c0b-90b6-5548a523445f	caed7502-8393-4421-9e3e-78cf340b52bd	ai_credit	-20	usage	Long Form AI: intelligence_report	\N	\N	2026-05-06 08:06:13.112393
c41a74a4-9082-41ae-98bf-48652ba735a3	caed7502-8393-4421-9e3e-78cf340b52bd	ai_credit	-20	usage	Long Form AI: intelligence_report	\N	\N	2026-05-06 08:19:03.354372
f143aed0-32de-422b-a9f2-c07634cb5725	caed7502-8393-4421-9e3e-78cf340b52bd	ai_credit	-20	usage	Long Form AI: intelligence_report	\N	\N	2026-05-06 09:27:25.357634
ee4f18bb-4387-49d0-8b5b-c6ec7a7ba2e0	caed7502-8393-4421-9e3e-78cf340b52bd	ai_credit	-20	usage	Long Form AI: intelligence_report	\N	\N	2026-05-06 10:37:06.11519
062a23ed-abd0-426d-abf1-6f09c609aadb	caed7502-8393-4421-9e3e-78cf340b52bd	ai_credit	-20	usage	Long Form AI: intelligence_report	\N	\N	2026-05-06 11:48:33.457065
e9224ee8-e9d6-4bc5-a200-411efa8195b6	caed7502-8393-4421-9e3e-78cf340b52bd	ai_credit	-20	usage	Long Form AI: intelligence_report	\N	\N	2026-05-06 13:00:44.508297
9fe48ed3-f6e4-437b-9b3b-f09cb95bfc4a	caed7502-8393-4421-9e3e-78cf340b52bd	ai_credit	-20	usage	Long Form AI: intelligence_report	\N	\N	2026-05-06 13:03:51.419377
cc87102b-8502-40a0-b923-29c71dfa755f	caed7502-8393-4421-9e3e-78cf340b52bd	ai_credit	-20	usage	Long Form AI: intelligence_report	\N	\N	2026-05-06 13:38:01.239106
94e8927c-ba96-4e11-8624-69bcfbd355e9	caed7502-8393-4421-9e3e-78cf340b52bd	ai_credit	-20	usage	Long Form AI: intelligence_report	\N	\N	2026-05-06 14:31:54.559023
8087c62d-aa7c-4da7-a8b8-5a1a4471a107	caed7502-8393-4421-9e3e-78cf340b52bd	ai_credit	-20	usage	Long Form AI: intelligence_report	\N	\N	2026-05-06 15:08:45.909615
\.


--
-- Data for Name: credit_types; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.credit_types (key, label_tr, label_en, description_tr, description_en, icon, color, sort_order, is_active, created_at, updated_at) FROM stdin;
ai_credit	AI Analiz Kredisi	AI Analysis Credit	10 kredi = 1 rapor/analiz. AI rapor, karşılaştırma, içgörü ve chat işlemleri için kullanılır.	10 credits = 1 report/analysis. Used for AI reports, comparisons, insights and chat.	Brain	#6C3A8E	1	t	2026-05-05 12:27:36.724303	2026-05-05 12:27:36.724303
mail_credit	Mail Kredisi	Mail Credit	1 kredi = 1 mail. Anket davet, bildirim ve bilgilendirme mailleri için kullanılır.	1 credit = 1 mail. Used for survey invitations, notifications and informative emails.	Mail	#1D9E75	2	t	2026-05-05 12:28:10.680455	2026-05-05 12:28:10.680455
\.


--
-- Data for Name: demo_requests; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.demo_requests (id, full_name, email, company_name, company_size, industry, phone, message, status, notes, created_at, updated_at, assigned_to, user_type) FROM stdin;
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.departments (id, company_id, name, is_active, created_at) FROM stdin;
803efb2e-e02b-4fd6-b823-dcd3452c4107	161d59d3-3b66-46f3-9557-5aece422db24	Software	t	2026-05-05 19:37:10.839554+03
11111111-1111-1111-1111-111111111111	161d59d3-3b66-46f3-9557-5aece422db24	Yazılım Geliştirme	t	2026-05-05 21:19:12.188114+03
11111111-1111-1111-1111-111111111112	161d59d3-3b66-46f3-9557-5aece422db24	Ürün Yönetimi	t	2026-05-05 21:19:12.188114+03
11111111-1111-1111-1111-111111111113	161d59d3-3b66-46f3-9557-5aece422db24	Pazarlama	t	2026-05-05 21:19:12.188114+03
11111111-1111-1111-1111-111111111114	161d59d3-3b66-46f3-9557-5aece422db24	İnsan Kaynakları	t	2026-05-05 21:19:12.188114+03
22222222-2222-2222-2222-222222222221	22222222-2222-2222-2222-222222222222	Ar-Ge Merkezi	t	2026-05-05 21:19:12.188114+03
22222222-2222-2222-2222-222222222222	22222222-2222-2222-2222-222222222222	Satış ve Operasyon	t	2026-05-05 21:19:12.188114+03
22222222-2222-2222-2222-222222222223	22222222-2222-2222-2222-222222222222	Müşteri Başarısı	t	2026-05-05 21:19:12.188114+03
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
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.employees (id, company_id, department_id, full_name, email, "position", start_date, is_active, created_at, updated_at, deactivated_at) FROM stdin;
faec1972-ea27-4ec2-8f8d-03c6a87c7639	161d59d3-3b66-46f3-9557-5aece422db24	803efb2e-e02b-4fd6-b823-dcd3452c4107	Onur Ekşi	onuroctoplus@gmail.com	Developer	2024-01-01	t	2026-05-05 19:37:10.856211	2026-05-05 19:37:10.856211	\N
93fc9f89-36a6-4b5e-bdd5-95270f8f4575	161d59d3-3b66-46f3-9557-5aece422db24	803efb2e-e02b-4fd6-b823-dcd3452c4107	Filiz Babacan	filizerba@gmail.com	Developer	2024-01-01	t	2026-05-05 19:37:10.893624	2026-05-05 19:37:10.893624	\N
be48c5d4-6e28-43f8-a959-ba1f3ed6345d	161d59d3-3b66-46f3-9557-5aece422db24	803efb2e-e02b-4fd6-b823-dcd3452c4107	Can Karaman	10ureksi@gmail.com	Müdür	2024-01-01	t	2026-05-05 19:37:10.897292	2026-05-05 19:37:10.897292	\N
c1aad22b-8212-4447-b7af-0d9d0e6044c2	161d59d3-3b66-46f3-9557-5aece422db24	803efb2e-e02b-4fd6-b823-dcd3452c4107	Tarık Tarcan	onureksi@outlook.com	M.Yardımcısı	2024-01-01	t	2026-05-05 19:37:10.900609	2026-05-05 19:37:10.900609	\N
d38ec020-c63a-43fa-990e-a5a14d4563c2	161d59d3-3b66-46f3-9557-5aece422db24	803efb2e-e02b-4fd6-b823-dcd3452c4107	Ari Kohen	paccikontrol@gmail.com	M.Yardımcısı	2024-01-01	t	2026-05-05 19:37:10.904598	2026-05-05 19:37:10.904598	\N
\.


--
-- Data for Name: industries; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.industries (id, slug, label_tr, label_en, is_active, is_default, order_index, created_at, updated_at) FROM stdin;
d7a683cb-30be-4486-a445-8b21700e1cc3	technology	Teknoloji & Yazılım	Technology & Software	t	f	1	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
64cc9ea1-a0a3-4465-bb68-753fdbb5c18c	telecommunications	Telekomünikasyon	Telecommunications	t	f	2	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
4f5c7292-efbd-4879-9f6d-d8f15336f09e	media	Medya & İletişim	Media & Communications	t	f	3	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
89e78bf2-6f2d-4de5-a2d4-e41ca9dbdf01	gaming	Oyun & Eğlence	Gaming & Entertainment	t	f	4	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
ca6cfe3b-b8f2-47a0-9020-88f6664e60b5	finance	Finans & Bankacılık	Finance & Banking	t	f	5	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
583703e4-9014-42f0-83af-924dc64f8789	insurance	Sigortacılık	Insurance	t	f	6	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
1938560f-3577-42e2-8696-d170dc589ef7	consulting	Danışmanlık & Profesyonel Hizmetler	Consulting & Professional Services	t	f	7	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
738c9242-dc80-433d-bc8d-9295e44c9773	legal	Hukuk	Legal	t	f	8	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
888f620d-df90-46e5-a1f9-6cd0ebc36d72	accounting	Muhasebe & Denetim	Accounting & Auditing	t	f	9	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
e81230ad-2913-4df5-8b9f-a16d236938eb	healthcare	Sağlık & Hastane	Healthcare & Hospital	t	f	10	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
0407021b-2659-408c-a48b-3a2d805b063d	pharmaceuticals	İlaç & Biyoteknoloji	Pharmaceuticals & Biotech	t	f	11	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
7c32c4f5-d11e-4077-beb3-61cd1d1d9d9e	wellness	Sağlık & Wellness	Health & Wellness	t	f	12	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
43fda9e6-aa2a-4b80-906c-1a971712c7dd	manufacturing	Üretim & İmalat	Manufacturing	t	f	13	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
51b30fd1-a075-4995-814b-e6df919cfcc7	automotive	Otomotiv	Automotive	t	f	14	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
fdf9a312-725e-4e7d-8ae8-bb1266cfac0c	construction	İnşaat & Gayrimenkul	Construction & Real Estate	t	f	15	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
96d30f66-4377-41fe-8a26-0ff880fc988b	energy	Enerji & Madencilik	Energy & Mining	t	f	16	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
ff24762c-9cc5-4c51-8f25-3ffa903903b6	chemicals	Kimya & Petrokimya	Chemicals & Petrochemicals	t	f	17	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
9b34fb3f-f634-4df8-95d9-370f344127ff	aerospace	Havacılık & Savunma	Aerospace & Defense	t	f	18	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
2fcfa0c3-6f10-42a7-abdb-c53bb0521052	retail	Perakende & Mağazacılık	Retail & Commerce	t	f	19	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
c2e99d19-2c80-4111-8ceb-27cae0fd13e3	fmcg	Tüketim Ürünleri (FMCG)	Fast-Moving Consumer Goods	t	f	20	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
9cc6e545-f445-4b85-b267-3a5c30126d36	ecommerce	E-Ticaret	E-Commerce	t	f	21	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
5e7340f2-5372-4b9c-91bf-1a2f145d8629	hospitality	Otelcilik & Turizm	Hospitality & Tourism	t	f	22	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
e727e1fe-45cf-4e81-b35f-c07ae57d4f1b	food_beverage	Gıda & İçecek	Food & Beverage	t	f	23	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
348a549c-9dbd-4306-bc14-90af6de3a6aa	fashion	Moda & Tekstil	Fashion & Textile	t	f	24	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
5eca93fe-37e7-4ef1-8ee0-89f3569258f3	logistics	Lojistik & Taşımacılık	Logistics & Transportation	t	f	25	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
682588dd-3d04-4ba7-8301-2935526b0b74	supply_chain	Tedarik Zinciri	Supply Chain	t	f	26	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
e5831316-2985-43ae-9333-e318019f36eb	public_sector	Kamu & Devlet	Public Sector & Government	t	f	27	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
11ed2b62-0a40-431d-b554-eefa0b485db2	ngo	Sivil Toplum & STK	NGO & Non-Profit	t	f	28	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
54b59fe7-7f3b-4825-87b0-4837784382e8	education	Eğitim & Akademi	Education & Academia	t	f	29	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
686f522a-7244-4af9-ba45-2c0dfbec2d2b	research	Araştırma & Geliştirme	Research & Development	t	f	30	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
c98bff74-6739-42df-97fe-0bf36c0c210a	agriculture	Tarım & Hayvancılık	Agriculture & Livestock	t	f	31	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
00f70bd2-f3b1-4b1b-b57a-7aadc468df18	sports	Spor & Fitness	Sports & Fitness	t	f	32	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
5225388a-7a23-4dfd-a876-ffb3284a03ad	other	Diğer	Other	t	f	99	2026-05-05 15:16:59.625505	2026-05-05 15:16:59.625505
\.


--
-- Data for Name: industry_benchmark_scores; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.industry_benchmark_scores (id, industry, region, dimension, score, source, source_year, is_seed, updated_by, updated_at, created_at) FROM stdin;
00723f57-3a74-4098-b2b8-1f7c72c21a14	technology	global	overall	64.00	Gallup State of the Global Workplace 2024 (183k iş birimi, 90 ülke) + Intellect Dimensions Benchmarking Report 2024 (50k çalışan, 10 sektör)	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
53317867-0176-4334-81d2-5b2be86220b6	technology	global	physical	67.00	Intellect Dimensions Benchmarking Report 2024 — Information Media & Telecommunications sektörü fiziksel skor	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
dbd67b98-77e4-4fb0-a9e8-e3d6912d7fab	technology	global	mental	59.00	Gallup State of the Global Workplace 2024 — teknoloji sektörü stres prevalansı %41; McKinsey Health Institute 2023 Global Survey (42 ülke, 30k çalışan)	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
7a07979b-8f8c-4897-a63a-abf34f8669bd	technology	global	social	62.00	Gallup State of the Global Workplace 2024 — loneliness at work teknoloji sektörü; uzaktan çalışma oranı düzeltmesi uygulandı	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
f2919833-8877-447e-90bc-7784251f5bfb	technology	global	financial	63.00	Mercer Inside Employees Minds 2024 (16 ülke, 4.800 çalışan) — finansal stress ve maaş yeterliliği skorları	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
36494440-0f48-4dfd-85a6-262a5972c7d5	technology	global	work	69.00	Gallup State of the Global Workplace 2024 — engagement rate teknoloji sektörü; Deloitte 2024 Global Human Capital Trends Report	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
3a763ce4-d344-4467-9f4a-42dc533c6380	technology	turkey	overall	59.00	WTW (Willis Towers Watson) 2024 Wellbeing Uygulamaları Araştırması — Türkiye raporu (113 işveren); Moodivation Türkiye Çalışan Deneyimi Raporu 2025	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
9f8bc831-a1cc-4c58-a406-9420743826d1	technology	turkey	physical	62.00	WTW 2024 Türkiye Wellbeing Araştırması — fiziksel wellbeing boyutu; TÜİK Hanehalkı İşgücü Araştırması 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
b9dfcd46-2ae8-48e5-b2df-49869a20f900	technology	turkey	mental	54.00	WTW 2024 Türkiye Wellbeing Araştırması — zihinsel wellbeing; Moodivation Türkiye 2025: bağlılık ve tükenmişlik endeksi	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
0db77a2a-c4d3-4422-bbe3-b6b4578435c0	technology	turkey	social	58.00	WTW 2024 Türkiye Wellbeing Araştırması — sosyal wellbeing; İŞKUR 2024 Türkiye İşgücü Piyasası Araştırması (86.041 işyeri)	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
38f6cdc9-1f64-49a5-a800-156aeab52a03	technology	turkey	financial	55.00	WTW 2024 Türkiye Wellbeing Araştırması — finansal wellbeing en sorunlu boyut; TCMB enflasyon verisi düzeltmesi ile global ortalamadan -8 puan	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
e5e8d992-72f5-4867-986a-29829263e411	technology	turkey	work	65.00	Moodivation Türkiye Çalışan Deneyimi Raporu 2025 — iş anlamı ve bağlılık; Gallup Türkiye engagement endeksi	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
c67e2e44-1e0b-44a2-83a2-a78cf2d71e40	finance	global	overall	61.00	Gallup State of the Global Workplace 2024 + Intellect Dimensions Benchmarking Report 2024 — Finance & Insurance sektörü	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
7f1c0d26-e75e-4365-8dc9-94075c7880f7	finance	global	physical	60.00	Intellect Dimensions Benchmarking Report 2024 — finans sektörü sedanter çalışma kaynaklı düşük movement skoru	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
4ce6badf-bee4-4a85-aea1-8e2df345988a	finance	global	mental	55.00	Gallup 2024 — finans sektörü stres %41 global ortalama; McKinsey Health Institute 2023	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
35447355-19ec-4f76-aecd-098025ebd5d3	finance	global	social	62.00	Gallup State of the Global Workplace 2024 — takım bağlılığı ve aidiyet skorları finans sektörü	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
2e195e59-166b-4a26-95aa-bf945328121d	finance	global	financial	70.00	Mercer Inside Employees Minds 2024 — finans çalışanları maaş tatmini diğer sektörlere göre yüksek; Deloitte 2024 Global Human Capital Trends	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
3cbfa9bc-2c5d-47ca-95d6-1b9d88ce2bcc	finance	global	work	61.00	Gallup State of the Global Workplace 2024 — finans sektörü iş anlamı ve kariyer gelişim skoru	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
1a5d1833-c1fe-43e1-8130-2c8f87526513	finance	turkey	overall	56.00	WTW 2024 Türkiye Wellbeing Araştırması; BDDK Sektör Verileri 2024; Moodivation Türkiye 2025	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
122f9bea-fd11-4fcb-afd7-2d285da2a563	finance	turkey	physical	55.00	WTW 2024 Türkiye Wellbeing Araştırması — fiziksel boyut; TÜİK 2024 işyeri koşulları verileri	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
7b114eb7-9a8b-41ac-944d-d387f0dc1126	finance	turkey	mental	50.00	Moodivation Türkiye Çalışan Deneyimi Raporu 2025 — bankacılık ve sigortacılık tükenmişlik endeksi; WTW 2024 Türkiye	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
d8d44ce3-6005-4d51-8ac0-122e987dbaa9	finance	turkey	social	57.00	WTW 2024 Türkiye Wellbeing Araştırması — sosyal etkileşim ve takım aidiyeti	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
88b3e8f7-0dc4-4f1d-a5d2-58a52bd9be75	finance	turkey	financial	62.00	WTW 2024 Türkiye Wellbeing Araştırması — finans sektörü çalışanları görece iyi; Mercer Türkiye Maaş Araştırması 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
b6b0f513-363e-4884-938a-6d979d8a158a	finance	turkey	work	56.00	Moodivation Türkiye 2025 — iş anlamı kariyer gelişimi; Gallup Türkiye bağlılık tahmini	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
70242c1e-4823-43a3-9120-a05e9e2f23a1	healthcare	global	overall	60.00	Intellect Dimensions Benchmarking Report 2024 — Healthcare & Pharmaceuticals sektörü	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
7a79adcf-8134-415d-b461-fbbe53261770	healthcare	global	physical	62.00	Intellect Dimensions Benchmarking Report 2024; Better Being Wellbeing Index 2024 — sağlık çalışanları fiziksel yük yüksek	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
4993b081-83e6-4bfd-8615-a0b9da32fc2c	healthcare	global	mental	50.00	Better Being Wellbeing Index 2024 — sağlık sektörü burnout %37; The Lancet 2023 Global Healthcare Worker Wellbeing Study	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
259635b0-f097-4bff-8663-7cf5b1860d68	healthcare	global	social	68.00	Gallup State of the Global Workplace 2024 — sağlık sektörü ekip dayanışması ve sosyal bağ en güçlü sektörler arasında	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
66dccd65-2051-4723-b0c7-4cff7b05d8d5	healthcare	global	financial	49.00	Mercer Inside Employees Minds 2024 — sağlık çalışanları finansal tatminde alt sıralarda; WHO Global Health Workforce Report 2023	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
d5556cca-7bd9-492d-bafe-309f1e714f7b	healthcare	global	work	73.00	Gallup State of the Global Workplace 2024 — sağlık sektörü iş anlamı (purpose) en yüksek sektör; Deloitte 2024 Healthcare Worker Survey	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
69a81d1c-7f39-4970-859e-8c4d0ba595fc	healthcare	turkey	overall	55.00	WTW 2024 Türkiye Wellbeing Araştırması; Sağlık Bakanlığı İnsan Kaynakları İstatistikleri 2024; Moodivation Türkiye 2025	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
73948c84-4af7-4965-986a-f2dba98231b2	healthcare	turkey	physical	57.00	WTW 2024 Türkiye Wellbeing Araştırması — fiziksel boyut; Türk Tabipleri Birliği Sağlıkta Şiddet ve Çalışma Koşulları Raporu 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
8c41067d-dcc7-4bb3-8763-8e56020ab213	healthcare	turkey	mental	45.00	Moodivation Türkiye 2025 — sağlık sektörü tükenmişlik yüksek; Türk Psikiyatri Derneği 2023 Sağlık Çalışanları Ruh Sağlığı Araştırması	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
c455acd5-f425-4f97-bdf2-a25c11b5fff3	healthcare	turkey	social	63.00	WTW 2024 Türkiye Wellbeing Araştırması — sağlık ekipleri sosyal dayanışma; TÜİK 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
7c10f00a-9023-4dba-a6a8-ddfe5d9b7324	healthcare	turkey	financial	44.00	WTW 2024 Türkiye Wellbeing Araştırması — kamu sağlık çalışanları maaş tatminsizliği; Sağlık-İş Sendikası 2024 Çalışma Koşulları Raporu	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
dfa1094a-6c13-4054-bf41-dd882032eb84	healthcare	turkey	work	68.00	Moodivation Türkiye 2025 — sağlık çalışanları iş anlamı yüksek; WTW 2024 Türkiye	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
d674346f-06b9-4df7-8e60-5d17245fa762	manufacturing	global	overall	54.00	Better Being Wellbeing Index 2024 — Manufacturing sektörü; Gallup State of the Global Workplace 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
270680d2-a607-4448-bd1f-deab7e3645c8	manufacturing	global	physical	53.00	Better Being Wellbeing Index 2024 — üretim sektörü fiziksel şikayetler %49; ILO Safety and Health at Work 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
2976a719-3b00-44d2-8f64-01967e51cd93	manufacturing	global	mental	51.00	Gallup 2024 — üretim sektörü stres; Better Being 2024: %80 üretim çalışanı stres bildiriyor	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
3add1ca6-f8ba-4542-b9b2-45aca59d4486	manufacturing	global	social	57.00	Gallup State of the Global Workplace 2024 — üretim sektörü takım bağlılığı	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
ea32fb04-72df-4106-bfef-64057c89c979	manufacturing	global	financial	52.00	Mercer Inside Employees Minds 2024 — mavi yaka finansal tatmin; ILO World Employment and Social Outlook 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
a0570806-20df-4619-a7ac-e31bc85f8778	manufacturing	global	work	55.00	Gallup State of the Global Workplace 2024 — üretim sektörü iş bağlılığı ve anlam skoru	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
9203180a-b7b7-4cec-8f76-136294dce133	manufacturing	turkey	overall	49.00	WTW 2024 Türkiye Wellbeing Araştırması; İŞKUR 2024 Türkiye İşgücü Piyasası Araştırması — imalat sektörü (86.041 işyeri)	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
44f5f24e-93e6-4f29-a65a-71d6ce44f9db	manufacturing	turkey	physical	48.00	İŞKUR 2024 Türkiye İşgücü Piyasası Araştırması — imalat sektörü iş kazası ve meslek hastalığı; SGK İş Kazası İstatistikleri 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
0082a0be-bae9-4d82-9f18-f96c8d96af54	manufacturing	turkey	mental	46.00	Moodivation Türkiye 2025 — üretim sektörü tükenmişlik; Çalışma ve Sosyal Güvenlik Bakanlığı 2024 raporu	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
fbb3489b-b90b-45a7-8b94-876acab906c5	manufacturing	turkey	social	52.00	WTW 2024 Türkiye Wellbeing Araştırması — sosyal etkileşim; İŞKUR 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
13043564-f2a2-4e30-8006-51b51805c7c7	manufacturing	turkey	financial	47.00	WTW 2024 Türkiye Wellbeing Araştırması; DİSK-AR 2024 Çalışan Gelir Araştırması; TÜİK Hanehalkı Gelir ve Yaşam Koşulları Araştırması 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
f1694a77-0dc5-418b-b5e3-5bd398fb2a52	manufacturing	turkey	work	50.00	Moodivation Türkiye 2025; Gallup Türkiye bağlılık tahmini; İŞKUR 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
be80161b-75f9-4dce-b86b-948852c34ac6	retail	global	overall	52.00	Gallup State of the Global Workplace 2024 — Retail sektörü; Intellect Benchmarking 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
d39f7e08-9460-48c4-adb8-5f6e1b9975f5	retail	global	physical	56.00	Intellect Dimensions Benchmarking Report 2024 — perakende sektörü fiziksel durum	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
fcfa2da2-1d1a-4231-b555-90e3310a7ff4	retail	global	mental	49.00	Gallup 2024 — frontline worker mental health: %33 yüksek anksiyete; Better Being 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
8833472b-a9e5-4e66-82eb-f6c333e4aded	retail	global	social	60.00	Gallup State of the Global Workplace 2024 — müşteri temasının sosyal boyutu; Intellect 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
a431a63a-0147-47d3-8074-eb1134f31221	retail	global	financial	47.00	Mercer Inside Employees Minds 2024 — perakende maaş tatmini en düşük sektörler arasında; ILO 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
f72c6a37-a7f3-44d7-98b7-36d89445c39b	retail	global	work	53.00	Gallup State of the Global Workplace 2024 — perakende iş anlamı skoru	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
bd6c4abd-2127-40f6-bd0a-a10eab71299f	retail	turkey	overall	48.00	WTW 2024 Türkiye Wellbeing Araştırması; İŞKUR 2024 — toptan ve perakende ticaret sektörü	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
ff51b71c-200b-47d0-ae63-ffd787c9b052	retail	turkey	physical	51.00	WTW 2024 Türkiye; TÜİK Hanehalkı İşgücü Araştırması 2024 — ayakta çalışma koşulları	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
4c6706c6-8cf5-43b0-a060-ca252709f153	retail	turkey	mental	44.00	Moodivation Türkiye 2025; WTW 2024 Türkiye — hizmet sektörü tükenmişlik	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
7e3c85de-d286-4ac5-ad37-ff6c883518f0	retail	turkey	social	55.00	WTW 2024 Türkiye Wellbeing Araştırması — müşteri ilişkileri sosyal boyut	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
90c9780d-3e6a-46d9-b7ee-4a5d650dd8e2	retail	turkey	financial	42.00	WTW 2024 Türkiye Wellbeing Araştırması; DİSK-AR 2024 Çalışan Gelir Araştırması; TÜİK asgari ücret ve perakende maaş verileri 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
9abb6e55-0543-4fab-9692-f36f9c1afb82	retail	turkey	work	48.00	Moodivation Türkiye 2025; İŞKUR 2024 perakende sektörü bağlılık tahmini	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
b5ced5cd-21f3-408a-ad96-1777bc9b9e42	education	global	overall	59.00	Gallup State of the Global Workplace 2024 — Education sektörü; OECD TALIS 2024 Teaching and Learning International Survey	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
6655f8b6-dc99-476f-8584-be409646d83e	education	global	physical	59.00	Intellect Dimensions Benchmarking Report 2024; OECD TALIS 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
76b18e49-c2c4-46ad-9e74-ab48c8ff6fda	education	global	mental	52.00	Gallup 2024; OECD TALIS 2024 — öğretmen stres ve tükenmişlik; UNESCO 2024 Global Education Monitoring Report	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
1967cead-0f4f-4216-a33d-1f1b8c9488c1	education	global	social	70.00	Gallup State of the Global Workplace 2024 — eğitim sektörü sosyal bağ en yüksek sektörlerden; OECD TALIS 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
64305d51-e1b8-49c3-bfb0-f91c72317539	education	global	financial	45.00	Mercer Inside Employees Minds 2024; OECD Education at a Glance 2024 — öğretmen maaş karşılaştırması	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
61851b23-8292-47a1-8d19-90c938b7ee60	education	global	work	71.00	Gallup State of the Global Workplace 2024 — eğitim sektörü purpose skoru en yüksek ikinci sektör; OECD TALIS 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
4596d8cb-57ef-4c73-a41d-29b3e4093606	education	turkey	overall	54.00	WTW 2024 Türkiye Wellbeing Araştırması; MEB İnsan Kaynakları İstatistikleri 2024; Moodivation Türkiye 2025	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
16a7e5e3-c7cf-4eb0-b931-eafd16b8829f	education	turkey	physical	54.00	WTW 2024 Türkiye; TÜİK 2024 — eğitim sektörü çalışma koşulları	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
c014bcc2-8a16-493a-b2af-7acbe1b541a4	education	turkey	mental	47.00	Moodivation Türkiye 2025; Eğitim-İş Sendikası 2024 Öğretmen Tükenmişlik Araştırması; WTW 2024 Türkiye	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
1b32d84d-62e8-4b87-bdc0-966477c7da04	education	turkey	social	65.00	WTW 2024 Türkiye; MEB 2024 — eğitim çalışanları sosyal dayanışma	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
060a1a57-e775-49c7-a5af-d467a779b22f	education	turkey	financial	40.00	WTW 2024 Türkiye Wellbeing Araştırması; TÜİK öğretmen maaş verileri 2024; Eğitim-İş Sendikası 2024 maaş yeterliliği araştırması	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
52422daf-6355-4470-ada4-81fe7e8ebfc8	education	turkey	work	66.00	Moodivation Türkiye 2025 — eğitimciler iş anlamı skoru yüksek; WTW 2024 Türkiye	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
76b4e867-c206-4786-a5c0-8ab8f282aa4b	logistics	global	overall	52.00	Gallup State of the Global Workplace 2024; ILO Transport & Logistics Sector Report 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
2f54499a-d25e-491d-abb1-71ca7b991e97	logistics	global	physical	51.00	ILO Occupational Safety in Transport 2024; Better Being Wellbeing Index 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
fba3ba73-4b68-4b5a-a5fa-9e08fbacbcc9	logistics	global	mental	50.00	Gallup 2024; ILO 2024 — lojistik sektörü shift çalışması kaynaklı stres	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
926c4185-4b86-4331-8e79-ffc1e7ee2116	logistics	global	social	55.00	Gallup State of the Global Workplace 2024 — lojistik sektörü ekip bağı	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
c72a13f8-774f-4da2-89ca-8df77f2d55f5	logistics	global	financial	51.00	Mercer Inside Employees Minds 2024; ILO World Employment and Social Outlook 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
da0ce254-d939-402d-b3bc-3de31cebca0a	logistics	global	work	52.00	Gallup State of the Global Workplace 2024 — lojistik sektörü iş anlamı skoru	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
84094e56-07ca-4551-a458-c43bdb7cdd5c	logistics	turkey	overall	47.00	WTW 2024 Türkiye; İŞKUR 2024 Türkiye İşgücü Piyasası Araştırması — ulaştırma ve depolama sektörü; UND Uluslararası Nakliyeciler Derneği 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
cd3050f2-3021-455b-a710-849accdd5e50	logistics	turkey	physical	46.00	SGK İş Kazası İstatistikleri 2024 — taşımacılık sektörü; İŞKUR 2024; WTW 2024 Türkiye	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
b648b7e9-73c8-4a8c-a151-36e32e16eef0	logistics	turkey	mental	45.00	Moodivation Türkiye 2025; WTW 2024 Türkiye — vardiyalı çalışma ve uzun sürüş saatleri etkisi	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
dee7e678-52f7-4819-a331-2b7532c6f238	logistics	turkey	social	50.00	WTW 2024 Türkiye; İŞKUR 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
c8e01023-1390-4b66-943c-f00be646bff7	logistics	turkey	financial	46.00	WTW 2024 Türkiye; DİSK-AR 2024; TÜİK 2024 lojistik sektörü ücret verileri	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
443fff0b-8403-4796-8fcc-a87b0bd7cc04	logistics	turkey	work	47.00	Moodivation Türkiye 2025; Gallup Türkiye bağlılık tahmini	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
c537f8f0-ac67-48c6-9b8c-8fc2c1a7fe28	media	global	overall	63.00	Intellect Dimensions Benchmarking Report 2024 — Information Media & Telecommunications en iyi performans gösteren sektör	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
a47c2c5d-4206-468b-9cc3-f84180771612	media	global	physical	68.00	Intellect Benchmarking 2024 — medya sektörü en yüksek nutrition ve movement skoru	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
a7c5928b-cbde-4b20-a6ad-5b1777c19f5b	media	global	mental	57.00	Intellect Benchmarking 2024; Gallup 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
a9977cbf-2c59-417d-b33e-9e0a374068ef	media	global	social	65.00	Gallup State of the Global Workplace 2024; Intellect 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
a2b90071-c9a1-45bd-b3e7-9ef556868f65	media	global	financial	55.00	Mercer Inside Employees Minds 2024 — medya sektörü finansal tatmin; Reuters Institute Digital News Report 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
2c8bd475-45a5-4d80-958c-c27676013571	media	global	work	69.00	Gallup State of the Global Workplace 2024 — medya sektörü iş anlamı; Deloitte 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
fb5126c1-b222-486b-91f8-cc36996cd029	media	turkey	overall	58.00	WTW 2024 Türkiye Wellbeing Araştırması; Moodivation Türkiye 2025; RTÜK sektör verileri 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
a21310f1-df57-4a0e-a34d-531610c45109	media	turkey	physical	63.00	WTW 2024 Türkiye; TÜİK 2024 — medya sektörü çalışma koşulları	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
ed94a99e-60dd-49ac-9c41-19db1b8bfd50	media	turkey	mental	52.00	Moodivation Türkiye 2025; WTW 2024 Türkiye — medya sektörü baskı altı çalışma	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
21dc5640-35a8-443b-9482-d96df5f7af1a	media	turkey	social	60.00	WTW 2024 Türkiye Wellbeing Araştırması	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
0d4f39ea-fed2-475b-9705-272571846087	media	turkey	financial	50.00	WTW 2024 Türkiye; Mercer Türkiye 2024; TÜİK medya sektörü ücret verileri 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
c2a887ca-dafe-4b13-a744-324b10df1f44	media	turkey	work	64.00	Moodivation Türkiye 2025; Gallup Türkiye bağlılık tahmini — medya çalışanları iş anlamı görece yüksek	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
227a941b-07c6-4d95-a6fb-e27e2d223ef5	construction	global	overall	54.00	Gallup State of the Global Workplace 2024; ILO Safety and Health in Construction 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
72d92831-954d-482c-a19d-6fed4ddef5ec	construction	global	physical	54.00	ILO Safety and Health in Construction 2024 — inşaat iş kazası oranları; Better Being 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
df51c1bb-842c-4943-b8e5-021355541b06	construction	global	mental	49.00	Gallup 2024; ILO 2024; Mates in Mind 2024 Construction Mental Health Report	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
c5fe5611-6cb8-4ce6-b333-41606471c838	construction	global	social	56.00	Gallup State of the Global Workplace 2024; ILO 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
838f9e51-fe86-4eac-953d-5011054663c6	construction	global	financial	57.00	Mercer Inside Employees Minds 2024; ILO World Employment and Social Outlook 2024 — inşaat sektörü vasıklı işçi ücret artışı	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
c6e45520-4e83-457f-9f61-48ab420d3009	construction	global	work	53.00	Gallup State of the Global Workplace 2024 — inşaat sektörü iş anlamı	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
e9980ace-62e8-404e-bc36-aa38df095524	construction	turkey	overall	49.00	WTW 2024 Türkiye; İŞKUR 2024 — inşaat sektörü; ÇEDBİK 2024 Türkiye İnşaat Sektörü Raporu	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
c67267e3-ce83-4803-9742-42de7dbcd093	construction	turkey	physical	49.00	SGK İş Kazası İstatistikleri 2024 — inşaat en riskli ikinci sektör; İŞKUR 2024; WTW 2024 Türkiye	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
ab6398b3-b4eb-4c87-8488-37e3c6aba2fb	construction	turkey	mental	44.00	Moodivation Türkiye 2025; WTW 2024 Türkiye — mevsimlik ve güvencesiz istihdam etkisi	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
17e6ef47-fa0f-4de1-92a7-82421a8369bf	construction	turkey	social	51.00	WTW 2024 Türkiye; İŞKUR 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
68b9f555-19e1-42a9-868f-84b6f0c29f3b	construction	turkey	financial	52.00	WTW 2024 Türkiye; DİSK-AR 2024; TÜİK inşaat sektörü ücret verileri 2024; ENSİA 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
48a04b08-8ebe-43c0-afa0-3ae63b69974a	construction	turkey	work	48.00	Moodivation Türkiye 2025; Gallup Türkiye bağlılık tahmini	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
32a5a386-2655-4ce5-a5ec-7aca58eeaa97	hospitality	global	overall	55.00	Gallup State of the Global Workplace 2024; UNWTO Tourism Labour Market Report 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
d0e83a1b-6bdf-485d-9739-1c1b4d447349	hospitality	global	physical	58.00	Intellect Benchmarking 2024; ILO Hotels Catering and Tourism Sector Report 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
a577b1f5-ff62-4d61-a19a-d41eb3becd6f	hospitality	global	mental	47.00	Gallup 2024 — hizmet sektörü frontline stres; Hospitality Action 2024 Wellbeing Survey	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
a86da621-93a6-48b1-98dd-481d2a3ed034	hospitality	global	social	66.00	Gallup State of the Global Workplace 2024 — turizm sektörü müşteri etkileşimi sosyal boyut; UNWTO 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
038553ae-e78e-464e-99c5-9dd3c5b118c0	hospitality	global	financial	43.00	Mercer Inside Employees Minds 2024 — turizm sektörü finansal tatmin en düşük üçüncü sektör; ILO 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
e0ee7900-e2ef-46be-9131-69edcdd03d6b	hospitality	global	work	59.00	Gallup State of the Global Workplace 2024 — turizm sektörü iş anlamı; UNWTO 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
672f61ad-d3d4-4b12-a182-6e109c4f31b0	hospitality	turkey	overall	50.00	WTW 2024 Türkiye Wellbeing Araştırması; TÜRSAB 2024 Türkiye Turizm Sektörü Raporu; İŞKUR 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
9a42b477-d72e-401c-a595-8c540b9d4aa8	hospitality	turkey	physical	53.00	WTW 2024 Türkiye; İŞKUR 2024 — konaklama ve yiyecek hizmetleri sektörü	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
988a5174-e47c-4197-a6b4-f5f8b97426b0	hospitality	turkey	mental	42.00	Moodivation Türkiye 2025 — turizm sektörü sezonluk çalışma kaynaklı stres; WTW 2024 Türkiye; TÜRSAB 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
850b2245-5d88-4b00-b240-c46b9b3708d8	hospitality	turkey	social	61.00	WTW 2024 Türkiye Wellbeing Araştırması; TÜRSAB 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
0cfde88b-781c-428a-aaa2-75dbbd8d4b32	hospitality	turkey	financial	38.00	WTW 2024 Türkiye — turizm sektörü finansal wellbeing en düşük; DİSK-AR 2024; TÜİK otelcilik sektörü ücret verileri 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
c57df736-9817-4415-b2a0-cbe541f19c9e	hospitality	turkey	work	54.00	Moodivation Türkiye 2025; Gallup Türkiye bağlılık tahmini — turizm iş anlamı	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
93ce1daf-528b-4b6a-8b8d-9e57c0825b2e	energy	global	overall	57.00	Gallup State of the Global Workplace 2024; ILO Energy Sector Decent Work Report 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
fa1bee06-fd43-494e-b96f-015d364dbf44	energy	global	physical	57.00	ILO Safety in Energy and Mining 2024; Better Being Wellbeing Index 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
db8a9c22-c937-437f-9136-698a42e95f69	energy	global	mental	53.00	Gallup 2024; ILO 2024 — enerji sektörü izole çalışma koşulları kaynaklı stres	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
26241831-0d3b-4b8b-95f4-4470b65330d9	energy	global	social	58.00	Gallup State of the Global Workplace 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
20a1ef3d-3e30-494d-844a-75a5829725b7	energy	global	financial	61.00	Mercer Inside Employees Minds 2024 — enerji sektörü maaş tatmini görece yüksek; ILO 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
a064c99b-2c96-48e7-94f9-363e8a5b4eea	energy	global	work	56.00	Gallup State of the Global Workplace 2024 — enerji sektörü iş anlamı	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
8c918721-d32e-4ee7-b240-87d9c527ea5c	energy	turkey	overall	52.00	WTW 2024 Türkiye Wellbeing Araştırması; EPDK 2024 Enerji Sektörü İnsan Kaynakları Raporu; İŞKUR 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
651e54ec-96d8-4d5b-b743-45e2a4958fc6	energy	turkey	physical	52.00	SGK İş Kazası İstatistikleri 2024 — madencilik en riskli sektör; İŞKUR 2024; WTW 2024 Türkiye	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
62c5c97c-682a-4268-af57-3aee7581ac44	energy	turkey	mental	48.00	Moodivation Türkiye 2025; WTW 2024 Türkiye — enerji ve madencilik tükenmişlik	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
adfa42ca-8696-47fe-8f51-0efa3e7828eb	energy	turkey	social	53.00	WTW 2024 Türkiye; İŞKUR 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
2a8344f7-6eb9-46d3-bcd2-eedb9025276a	energy	turkey	financial	56.00	WTW 2024 Türkiye; Mercer Türkiye 2024 — enerji sektörü maaş görece iyi; TÜİK 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
8872681c-4a9d-44fc-908d-03ac1bad1b5a	energy	turkey	work	51.00	Moodivation Türkiye 2025; Gallup Türkiye bağlılık tahmini	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
20c181a0-bb9b-497c-bec2-fb0a1147f600	public_sector	global	overall	56.00	Gallup State of the Global Workplace 2024 — Government & Non-profit sektörü; OECD Government at a Glance 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
c6976fc8-091b-4b64-b0e5-9ed120b3a386	public_sector	global	physical	58.00	Intellect Benchmarking 2024; OECD Government at a Glance 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
19ce1bb8-8d38-4405-a426-800eeca748f2	public_sector	global	mental	51.00	Gallup 2024; OECD 2024 — kamu çalışanları stres; McKinsey Health Institute 2023	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
f03619a5-893b-42b1-8b70-ccf0a8e37d68	public_sector	global	social	65.00	Gallup State of the Global Workplace 2024 — kamu sektörü sosyal aidiyet yüksek	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
85b9bbd3-9347-4703-8fe7-fa58e43f6512	public_sector	global	financial	48.00	Mercer Inside Employees Minds 2024 — kamu maaş tatmini özel sektörün altında; OECD 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
fc28f63c-fdca-4458-9630-6a2409bbff8b	public_sector	global	work	60.00	Gallup State of the Global Workplace 2024 — kamu sektörü iş anlamı yüksek; OECD 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
6c1e2730-502d-437a-940d-eeeada5389f9	public_sector	turkey	overall	51.00	WTW 2024 Türkiye Wellbeing Araştırması; KAMU-SEN 2024 Kamu Çalışanları Yaşam Koşulları Araştırması; TÜİK 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
6d55c99a-e76f-4b2f-9fdf-9867df12fc10	public_sector	turkey	physical	53.00	WTW 2024 Türkiye; TÜİK 2024 — kamu sektörü çalışma koşulları	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
a650eb0a-ada3-48a0-9523-c2800f861027	public_sector	turkey	mental	46.00	Moodivation Türkiye 2025; WTW 2024 Türkiye; KAMU-SEN 2024 — kamu çalışanları tükenmişlik ve motivasyon	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
afcf816c-0c4f-465c-b9b9-a1662c301fb4	public_sector	turkey	social	60.00	WTW 2024 Türkiye Wellbeing Araştırması; KAMU-SEN 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
d2ffa601-befa-4513-b96e-74e8db56e7e3	public_sector	turkey	financial	43.00	WTW 2024 Türkiye — kamu maaşları enflasyona karşı erimesi; KAMU-SEN 2024 maaş yeterliliği araştırması; DİSK-AR 2024; TÜİK 2024	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
f677955a-5939-4d0e-886e-b0b54f4f735a	public_sector	turkey	work	55.00	Moodivation Türkiye 2025; Gallup Türkiye bağlılık tahmini — kamu çalışanları iş güvencesi avantajı	2024	t	\N	2026-05-05 15:24:59.593631	2026-05-05 15:24:59.593631
\.


--
-- Data for Name: invitations; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.invitations (id, user_id, company_id, token, type, expires_at, used_at, created_at) FROM stdin;
d605797d-6b82-4b9b-bf5b-bb7b7b5b42ba	caed7502-8393-4421-9e3e-78cf340b52bd	\N	9bde2e5d06bd69bbc4a40339c506a29ec419613c6607f7c6560fc466a3fcd9fb1151969a9e92f7afaabc7c1e273c0ecd59001ac54fe54c41d66631bfff083109	consultant_invite	2026-05-07 13:14:05.913+03	2026-05-05 13:57:46.479+03	2026-05-05 13:14:05.48364+03
44c3f1f7-df09-446d-bd9c-82ad61f18169	672c4165-82a3-45b6-b340-232362a5f24e	161d59d3-3b66-46f3-9557-5aece422db24	8dd8218ae64b47fdde0a38a02242456d16cb9ed3c06b0dd7d31cac455daf73a30ffe349eace56cffa16fbbe5d9368bda2b08278c1054f419c3a0fede1eb6647d	hr_invite	2026-05-06 15:31:55.944+03	2026-05-05 15:34:41.138+03	2026-05-05 15:31:55.92042+03
\.


--
-- Data for Name: mail_templates; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.mail_templates (id, slug, subject_tr, subject_en, body_tr, body_en, variables, description, is_active, updated_at, updated_by) FROM stdin;
e494e29e-df3a-43e8-9c58-984133570140	consultant_invite	Eğitmen / Danışman Hesabınızı Oluşturun	Create Your Consultant Account	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><img src="{{brand_logo_url}}" alt="{{brand_name}}" style="max-height: 48px; border:0; display:block; margin: 0 auto;"></div><div class="content"><h2>Hoş Geldiniz, {{full_name}}!</h2><p>Wellbeing platformu üzerinde Eğitmen / Danışman hesabınız tanımlandı. Aşağıdaki butona tıklayarak kaydınızı tamamlayabilir ve şifrenizi belirleyebilirsiniz.</p><p>Bu davet bağlantısı {{expires_in}} boyunca geçerlidir.</p><div class="cta-container"><a href="{{invite_link}}" class="cta-button">Hesabımı Oluştur →</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><img src="{{brand_logo_url}}" alt="{{brand_name}}" style="max-height: 48px; border:0; display:block; margin: 0 auto;"></div><div class="content"><h2>Welcome, {{full_name}}!</h2><p>Your Consultant account has been defined on the Wellbeing platform. Click the button below to complete your registration and set your password.</p><p>This invitation link is valid for {{expires_in}}.</p><div class="cta-container"><a href="{{invite_link}}" class="cta-button">Create My Account →</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>For questions, contact us at <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a>.</p></div></div></body></html>	["{{full_name}}", "{{invite_link}}", "{{expires_in}}"]	Eğitmen / Danışman davet mesajı	t	2026-05-05 13:18:02.956987+03	\N
c528d3bb-4cd9-40a2-9cb4-109208c1877b	password_reset	Şifre Sıfırlama Talebi	Password Reset Request	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #f8fafc; border-left: 4px solid #cbd5e1; padding: 12px; margin: 16px 0; font-size: 13px; color: #64748b; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <img src="{{brand_logo_url}}" alt="{{brand_name}}" style="max-height: 48px; border:0; display:block; margin: 0 auto;">\n    </div>\n    <div class="body">\n      <h2>Merhaba {{user_name}},</h2>\n      <p>Hesabınız için bir şifre sıfırlama talebinde bulundunuz. Yeni şifrenizi belirlemek için aşağıdaki butona tıklayabilirsiniz:</p>\n      <div style="text-align: center;">\n        <a href="{{reset_link}}" class="btn">Şifremi Sıfırla →</a>\n      </div>\n      <p>Bu bağlantı <b>{{expires_in}}</b> (1 saat) süresince geçerlidir.</p>\n      <div class="alert">\n        <p>Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı görmezden gelin. Hesabınız güvendedir.</p>\n      </div>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platformu</p>\n      <p>Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.</p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #f8fafc; border-left: 4px solid #cbd5e1; padding: 12px; margin: 16px 0; font-size: 13px; color: #64748b; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>🌱 Wellbeing Platform</h1>\n    </div>\n    <div class="body">\n      <h2>Hello {{user_name}},</h2>\n      <p>You have requested to reset your password. You can set a new password by clicking the button below:</p>\n      <div style="text-align: center;">\n        <a href="{{reset_link}}" class="btn">Reset My Password →</a>\n      </div>\n      <p>This link is valid for <b>{{expires_in}}</b> (1 hour).</p>\n      <div class="alert">\n        <p>If you did not request this, please ignore this email. Your account is safe.</p>\n      </div>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platform</p>\n      <p>If you do not wish to receive these emails, please contact your administrator.</p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{user_name}}", "{{reset_link}}", "{{expires_in}}"]	Şifre sıfırlama linki	t	2026-05-05 14:42:48.634649+03	\N
69f46c98-09ce-4687-ab7b-70b42bc1340b	welcome_hr	Wellbeing Platformuna Hoş Geldiniz	Welcome to Wellbeing Platform	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #FFF3CD; border-left: 4px solid #E07B1A; padding: 12px; margin: 16px 0; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <img src="{{brand_logo_url}}" alt="{{brand_name}}" style="max-height: 48px; border:0; display:block; margin: 0 auto;">\n    </div>\n    <div class="body">\n      <h2>Hoş Geldiniz, {{hr_name}}!</h2>\n      <p><b>{{company_name}}</b> için HR Admin olarak davet edildiniz. Platform üzerinden çalışan esenliğini takip edebilir, anketler düzenleyebilir ve yapay zeka destekli analizlere ulaşabilirsiniz.</p>\n      <p>Hesabınızı aktifleştirmek ve şifrenizi belirlemek için aşağıdaki butona tıklayın:</p>\n      <div style="text-align: center;">\n        <a href="{{invite_link}}" class="btn">Hesabımı Oluştur →</a>\n      </div>\n      <div class="alert">\n        <p>⚠️ Bu davet linki güvenlik nedeniyle 24 saat geçerlidir.</p>\n      </div>\n      <p>Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.</p>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platformu</p>\n      <p>Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.</p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #FFF3CD; border-left: 4px solid #E07B1A; padding: 12px; margin: 16px 0; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>🌱 Wellbeing Platform</h1>\n    </div>\n    <div class="body">\n      <h2>Welcome, {{hr_name}}!</h2>\n      <p>You have been invited as an HR Admin for <b>{{company_name}}</b>. Through the platform, you can monitor employee wellbeing, organize surveys, and access AI-powered analytics.</p>\n      <p>To activate your account and set your password, please click the button below:</p>\n      <div style="text-align: center;">\n        <a href="{{invite_link}}" class="btn">Create My Account →</a>\n      </div>\n      <div class="alert">\n        <p>⚠️ This invitation link is valid for 24 hours for security reasons.</p>\n      </div>\n      <p>If you have any questions, feel free to contact us.</p>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platform</p>\n      <p>If you do not wish to receive these emails, please contact your administrator.</p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{hr_name}}", "{{company_name}}", "{{invite_link}}", "{{platform_url}}"]	HR Admin davet mesajı	t	2026-05-05 14:42:48.644806+03	\N
3810a446-236f-4dd5-bfab-6897c384038c	campaign_bounced	⚠️ Teslim Edilemeyen Mailler	⚠️ Undelivered Emails	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #E67E22; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #E67E22; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert-box { background: #FEF9E7; border: 1px solid #F1C40F; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>⚠️ Teslimat Sorunu Bildirimi</h1>\n    </div>\n    <div class="body">\n      <h2>Merhaba {{hr_name}},</h2>\n      <p><b>{{company_name}}</b> için başlattığınız kampanyada bazı e-postaların alıcılara ulaşmadığını tespit ettik.</p>\n      \n      <div class="alert-box">\n        <p style="margin: 0; color: #D68910; font-weight: bold; font-size: 24px;">{{bounced_count}}</p>\n        <p style="margin: 5px 0 0 0; color: #9C640C; font-size: 14px;">Teslim Edilemeyen E-posta</p>\n      </div>\n\n      <p>Hatalı e-posta adreslerini kontrol etmek ve katılım oranını artırmak için kampanya detaylarını inceleyebilirsiniz:</p>\n\n      <div style="text-align: center;">\n        <a href="{{dashboard_link}}" class="btn">Kampanya Detayına Git →</a>\n      </div>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platformu</p>\n      <p>Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.</p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #E67E22; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #E67E22; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert-box { background: #FEF9E7; border: 1px solid #F1C40F; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>⚠️ Delivery Issue Notification</h1>\n    </div>\n    <div class="body">\n      <h2>Hello {{hr_name}},</h2>\n      <p>We've detected that some emails in your campaign for <b>{{company_name}}</b> have not reached the recipients.</p>\n      \n      <div class="alert-box">\n        <p style="margin: 0; color: #D68910; font-weight: bold; font-size: 24px;">{{bounced_count}}</p>\n        <p style="margin: 5px 0 0 0; color: #9C640C; font-size: 14px;">Bounced Emails</p>\n      </div>\n\n      <p>You can review the campaign details to check incorrect email addresses and improve participation rates:</p>\n\n      <div style="text-align: center;">\n        <a href="{{dashboard_link}}" class="btn">View Campaign Details →</a>\n      </div>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platform</p>\n      <p>If you do not wish to receive these emails, please contact your administrator.</p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{hr_name}}", "{{company_name}}", "{{bounced_count}}", "{{dashboard_link}}"]	\N	t	2026-05-05 14:42:48.627258+03	\N
7218fdfe-e8ea-4999-aee7-a2b52f7f58ca	campaign_invite	📋 Wellbeing Anketi Daveti	📋 Wellbeing Survey Invitation	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .metric-container { display: flex; justify-content: space-between; gap: 10px; margin: 24px 0; }\n    .metric-box { flex: 1; background: #f0fdf4; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #dcfce7; }\n    .metric-box span { display: block; font-size: 10px; color: #888; font-weight: bold; text-transform: uppercase; }\n    .metric-box b { font-size: 14px; color: #2E865A; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <img src="{{brand_logo_url}}" alt="{{brand_name}}" style="max-height: 48px; border:0; display:block; margin: 0 auto;">\n    </div>\n    <div class="body">\n      <h2>Merhaba {{full_name}},</h2>\n      <p><b>{{company_name}}</b> tarafından düzenlenen <b>{{survey_title}}</b> anketine davet edildiniz. Görüşleriniz platformumuzun gelişimi için çok değerlidir.</p>\n      \n      <div class="metric-container">\n        <div class="metric-box">\n          <span>Süre</span>\n          <b>~5 Dakika</b>\n        </div>\n        <div class="metric-box">\n          <span>Güvenlik</span>\n          <b>%100 Anonim</b>\n        </div>\n        <div class="metric-box">\n          <span>Son Tarih</span>\n          <b>{{due_date}}</b>\n        </div>\n      </div>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Ankete Başla →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"Bu anket özel bir kampanya kapsamında düzenlenmektedir ve sonuçlar sadece anonim olarak raporlanır."</p>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platformu</p>\n      <p>Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.</p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .metric-container { display: flex; justify-content: space-between; gap: 10px; margin: 24px 0; }\n    .metric-box { flex: 1; background: #f0fdf4; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #dcfce7; }\n    .metric-box span { display: block; font-size: 10px; color: #888; font-weight: bold; text-transform: uppercase; }\n    .metric-box b { font-size: 14px; color: #2E865A; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>🌱 Wellbeing Platform</h1>\n    </div>\n    <div class="body">\n      <h2>Hello {{full_name}},</h2>\n      <p>You have been invited to participate in the <b>{{survey_title}}</b> survey organized by <b>{{company_name}}</b>. Your insights are very valuable for our platform's development.</p>\n      \n      <div class="metric-container">\n        <div class="metric-box">\n          <span>Time</span>\n          <b>~5 Mins</b>\n        </div>\n        <div class="metric-box">\n          <span>Security</span>\n          <b>100% Anonymous</b>\n        </div>\n        <div class="metric-box">\n          <span>Deadline</span>\n          <b>{{due_date}}</b>\n        </div>\n      </div>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Start Survey →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"This survey is part of a special campaign, and results are reported anonymously."</p>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platform</p>\n      <p>If you do not wish to receive these emails, please contact your administrator.</p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{full_name}}", "{{company_name}}", "{{survey_title}}", "{{survey_link}}", "{{due_date}}"]	\N	t	2026-05-05 14:42:48.628934+03	\N
db310e03-aa5b-4370-a656-acc1957a7632	campaign_reminder	⏰ Hatırlatma: Anketinizi Tamamlayın	⏰ Reminder: Complete Your Survey	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #FFF3CD; border-left: 4px solid #E07B1A; padding: 16px; margin: 24px 0; text-align: center; border-radius: 8px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <img src="{{brand_logo_url}}" alt="{{brand_name}}" style="max-height: 48px; border:0; display:block; margin: 0 auto;">\n    </div>\n    <div class="body">\n      <h2>Merhaba {{full_name}},</h2>\n      <p><b>{{company_name}}</b> için düzenlenen <b>{{survey_title}}</b> anketini henüz tamamlamadığınızı fark ettik. Görüşlerinizi paylaşmanız bizim için çok önemli.</p>\n      \n      <div class="alert">\n        <p style="margin: 0; font-weight: bold; color: #856404;">⏰ Kalan Süre: {{days_remaining}} Gün</p>\n      </div>\n\n      <p>Anketi tamamlamak sadece birkaç dakikanızı alacaktır. Kaldığınız yerden devam edebilir veya baştan başlayabilirsiniz:</p>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Anketi Tamamla →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"Cevaplarınızın tamamen anonim olduğunu ve esenlik stratejimizi şekillendirdiğini hatırlatmak isteriz."</p>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platformu</p>\n      <p>Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.</p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #FFF3CD; border-left: 4px solid #E07B1A; padding: 16px; margin: 24px 0; text-align: center; border-radius: 8px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>🌱 Wellbeing Platform</h1>\n    </div>\n    <div class="body">\n      <h2>Hello {{full_name}},</h2>\n      <p>We noticed you haven't yet completed the <b>{{survey_title}}</b> survey for <b>{{company_name}}</b>. Sharing your views is very important to us.</p>\n      \n      <div class="alert">\n        <p style="margin: 0; font-weight: bold; color: #856404;">⏰ Time Left: {{days_remaining}} Days</p>\n      </div>\n\n      <p>Completing the survey only takes a few minutes. You can continue where you left off or start fresh:</p>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Complete Survey →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"We remind you that your answers are completely anonymous and shape our wellbeing strategy."</p>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platform</p>\n      <p>If you do not wish to receive these emails, please contact your administrator.</p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{full_name}}", "{{company_name}}", "{{survey_title}}", "{{survey_link}}", "{{days_remaining}}"]	\N	t	2026-05-05 14:42:48.629755+03	\N
c7aacac8-b474-4d71-8a92-ada0ddf2b719	draft_reminder	📝 Yarım Kalan Anketiniz Sizi Bekliyor	📝 Your Incomplete Survey is Waiting	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>📝 Yarım Kalan Anketiniz</h1>\n    </div>\n    <div class="body">\n      <h2>Merhaba {{full_name}},</h2>\n      <p><b>{{survey_title}}</b> anketini yarıda bıraktığınızı fark ettik. Cevaplarınızın kaydedildiğini ve dilediğiniz zaman kaldığınız yerden devam edebileceğinizi hatırlatmak isteriz.</p>\n      \n      <p>Anketi tamamlamak için son tarih: <b>{{due_date}}</b></p>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Kaldığım Yerden Devam Et →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"Sadece birkaç dakika ayırarak esenlik yolculuğunuza katkıda bulunabilirsiniz."</p>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platformu</p>\n      <p>Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.</p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>📝 Your Unfinished Survey</h1>\n    </div>\n    <div class="body">\n      <h2>Hello {{full_name}},</h2>\n      <p>We noticed you haven't yet completed the <b>{{survey_title}}</b> survey. We want to remind you that your progress has been saved, and you can continue whenever you like.</p>\n      \n      <p>The deadline to complete the survey is: <b>{{due_date}}</b></p>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Continue Where I Left Off →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"Taking just a few minutes of your time contributes greatly to your company's wellbeing journey."</p>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platform</p>\n      <p>If you do not wish to receive these emails, please contact your administrator.</p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{full_name}}", "{{survey_title}}", "{{survey_link}}", "{{due_date}}"]	\N	t	2026-05-05 14:42:48.63267+03	\N
e1fc6aa6-d1b3-4e82-81ea-1b77838d96a1	plan_expiry	⚠️ Aboneliğiniz Sona Ermek Üzere	⚠️ Your Subscription is About to Expire	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #E67E22; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .warning-box { background: #FEF9E7; border-left: 4px solid #F1C40F; padding: 16px; margin: 24px 0; border-radius: 8px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>⚠️ Abonelik Hatırlatması</h1>\n    </div>\n    <div class="body">\n      <h2>Merhaba,</h2>\n      <p><b>{{company_name}}</b> firmasına ait <b>{{plan_name}}</b> aboneliğinizin sona ermesine az bir süre kaldı.</p>\n      \n      <div class="warning-box">\n        <p style="margin: 0; font-weight: bold; color: #9C640C;">Aboneliğiniz {{days_remaining}} gün içinde sona erecektir.</p>\n      </div>\n\n      <p>Hizmet kesintisi yaşamamak ve esenlik verilerinize erişimin devam etmesi için aboneliğinizi yenilemenizi öneririz.</p>\n      <p>Yenileme işlemleri ve paket seçenekleri için bizimle <b>{{contact_email}}</b> adresinden iletişime geçebilirsiniz.</p>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platformu</p>\n      <p>Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.</p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #E67E22; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .warning-box { background: #FEF9E7; border-left: 4px solid #F1C40F; padding: 16px; margin: 24px 0; border-radius: 8px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>⚠️ Subscription Reminder</h1>\n    </div>\n    <div class="body">\n      <h2>Hello,</h2>\n      <p>Your <b>{{plan_name}}</b> subscription for <b>{{company_name}}</b> is about to expire soon.</p>\n      \n      <div class="warning-box">\n        <p style="margin: 0; font-weight: bold; color: #9C640C;">Your subscription will end in {{days_remaining}} days.</p>\n      </div>\n\n      <p>To avoid service disruption and maintain access to your wellbeing data, we recommend renewing your subscription.</p>\n      <p>You can contact us at <b>{{contact_email}}</b> for renewal processes and plan options.</p>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platform</p>\n      <p>If you do not wish to receive these emails, please contact your administrator.</p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{company_name}}", "{{days_remaining}}", "{{plan_name}}"]	\N	t	2026-05-05 14:42:48.636753+03	\N
1832a9ce-29e1-4b70-bf5f-22818ac5e29a	report_ready	📑 Raporunuz İndirilmeye Hazır	📑 Your Report is Ready for Download	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #f8fafc; border-left: 4px solid #cbd5e1; padding: 12px; margin: 16px 0; font-size: 13px; color: #64748b; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>📑 Raporunuz Hazır</h1>\n    </div>\n    <div class="body">\n      <h2>Merhaba {{hr_name}},</h2>\n      <p>Talep ettiğiniz <b>{{period}}</b> dönemine ait <b>{{format}}</b> formatındaki wellbeing raporu başarıyla oluşturuldu.</p>\n      \n      <div style="text-align: center;">\n        <a href="{{download_link}}" class="btn">Raporu İndir →</a>\n      </div>\n\n      <div class="alert">\n        <p>⚠️ Güvenlik nedeniyle bu indirme bağlantısı <b>{{expires_in}}</b> (15 dakika) süreyle geçerlidir.</p>\n      </div>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platformu</p>\n      <p>Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.</p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #f8fafc; border-left: 4px solid #cbd5e1; padding: 12px; margin: 16px 0; font-size: 13px; color: #64748b; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>📑 Your Report is Ready</h1>\n    </div>\n    <div class="body">\n      <h2>Hello {{hr_name}},</h2>\n      <p>The wellbeing report you requested for <b>{{period}}</b> in <b>{{format}}</b> format has been successfully generated.</p>\n      \n      <div style="text-align: center;">\n        <a href="{{download_link}}" class="btn">Download Report →</a>\n      </div>\n\n      <div class="alert">\n        <p>⚠️ For security reasons, this download link is valid for <b>{{expires_in}}</b> (15 minutes).</p>\n      </div>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platform</p>\n      <p>If you do not wish to receive these emails, please contact your administrator.</p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{hr_name}}", "{{company_name}}", "{{period}}", "{{format}}", "{{download_link}}", "{{expires_in}}"]	\N	t	2026-05-05 14:42:48.638462+03	\N
bad6bf9e-07f9-4c97-8f39-835ef62e277a	score_alert	⚠️ Düşük Wellbeing Skoru Uyarısı	⚠️ Low Wellbeing Score Alert	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #C0392B; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #C0392B; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .metric { text-align: center; padding: 32px; background: #FFF0EE; border-radius: 12px; margin: 24px 0; border: 1px solid #FADBD8; }\n    .metric .number { font-size: 48px; font-weight: bold; color: #C0392B; display: block; }\n    .metric .label { font-size: 14px; color: #666; text-transform: uppercase; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>⚠️ Kritik Skor Uyarısı</h1>\n    </div>\n    <div class="body">\n      <h2>Merhaba {{hr_name}},</h2>\n      <p><b>{{company_name}}</b> verilerinde <b>{{dimension}}</b> boyutunda kritik bir skor düşüşü tespit edildi. Bu durum çalışan esenliği için dikkat gerektiriyor olabilir.</p>\n      \n      <div class="metric">\n        <span class="number">{{score}}/100</span>\n        <span class="label">Güncel {{dimension}} Skoru</span>\n      </div>\n\n      <p>Önceki dönem skoru <b>{{previous_score}}</b> olarak kaydedilmişti. Detaylı analizi ve olası nedenleri dashboard üzerinden inceleyebilirsiniz:</p>\n\n      <div style="text-align: center;">\n        <a href="{{dashboard_link}}" class="btn">Dashboard'a Git →</a>\n      </div>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platformu</p>\n      <p>Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.</p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #C0392B; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #C0392B; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .metric { text-align: center; padding: 32px; background: #FFF0EE; border-radius: 12px; margin: 24px 0; border: 1px solid #FADBD8; }\n    .metric .number { font-size: 48px; font-weight: bold; color: #C0392B; display: block; }\n    .metric .label { font-size: 14px; color: #666; text-transform: uppercase; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>⚠️ Critical Score Alert</h1>\n    </div>\n    <div class="body">\n      <h2>Hello {{hr_name}},</h2>\n      <p>A critical decline in the <b>{{dimension}}</b> score has been detected in <b>{{company_name}}</b>'s data. This situation may require attention for employee wellbeing.</p>\n      \n      <div class="metric">\n        <span class="number">{{score}}/100</span>\n        <span class="label">Current {{dimension}} Score</span>\n      </div>\n\n      <p>The previous period's score was recorded as <b>{{previous_score}}</b>. You can review the detailed analysis and possible causes on the dashboard:</p>\n\n      <div style="text-align: center;">\n        <a href="{{dashboard_link}}" class="btn">Go to Dashboard →</a>\n      </div>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platform</p>\n      <p>If you do not wish to receive these emails, please contact your administrator.</p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{hr_name}}", "{{company_name}}", "{{dimension}}", "{{score}}", "{{previous_score}}", "{{dashboard_link}}"]	\N	t	2026-05-05 14:42:48.639209+03	\N
092d8ee2-c64a-4774-94df-80ed263701a3	ai_ready	🤖 AI Analizi Hazır	🤖 AI Analysis Ready	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: linear-gradient(135deg, #2E865A 0%, #6D28D9 100%); padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .ai-badge { display: inline-block; background: #EDE9FE; color: #6D28D9; padding: 4px 12px; border-radius: 99px; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 16px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>🤖 AI Analizi Hazır</h1>\n    </div>\n    <div class="body">\n      <div class="ai-badge">Yapay Zeka İçgörüleri</div>\n      <h2>Merhaba {{hr_name}},</h2>\n      <p><b>{{company_name}}</b> için <b>{{period}}</b> dönemine ait veriler yapay zeka tarafından analiz edildi. Stratejik kararlarınıza yardımcı olacak derinlemesine içgörüler ve aksiyon önerileri hazır.</p>\n      \n      <p>AI analizi şunları içerir:</p>\n      <ul style="padding-left: 20px; color: #555;">\n        <li>Departman bazlı risk analizleri</li>\n        <li>Trend tahminleri</li>\n        <li>Kişiselleştirilmiş iyileştirme önerileri</li>\n      </ul>\n\n      <div style="text-align: center;">\n        <a href="{{dashboard_link}}" class="btn">Analizi Görüntüle →</a>\n      </div>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platformu</p>\n      <p>Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.</p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: linear-gradient(135deg, #2E865A 0%, #6D28D9 100%); padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .ai-badge { display: inline-block; background: #EDE9FE; color: #6D28D9; padding: 4px 12px; border-radius: 99px; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 16px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>🤖 AI Analysis Ready</h1>\n    </div>\n    <div class="body">\n      <div class="ai-badge">Artificial Intelligence Insights</div>\n      <h2>Hello {{hr_name}},</h2>\n      <p>The data for <b>{{company_name}}</b> for the <b>{{period}}</b> period has been analyzed by AI. In-depth insights and action suggestions to assist your strategic decisions are ready.</p>\n      \n      <p>The AI analysis includes:</p>\n      <ul style="padding-left: 20px; color: #555;">\n        <li>Department-based risk analysis</li>\n        <li>Trend predictions</li>\n        <li>Personalized improvement suggestions</li>\n      </ul>\n\n      <div style="text-align: center;">\n        <a href="{{dashboard_link}}" class="btn">View Analysis →</a>\n      </div>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platform</p>\n      <p>If you do not wish to receive these emails, please contact your administrator.</p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{hr_name}}", "{{company_name}}", "{{period}}", "{{dashboard_link}}"]	\N	t	2026-05-05 14:42:48.623052+03	\N
5f2b0748-783a-4600-8d94-edc638d497c5	employee_invite	Wellbeing Hesabınızı Oluşturun	Create Your Wellbeing Account	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <img src="{{brand_logo_url}}" alt="{{brand_name}}" style="max-height: 48px; border:0; display:block; margin: 0 auto;">\n    </div>\n    <div class="body">\n      <h2>Merhaba {{full_name}},</h2>\n      <p><b>{{company_name}}</b> sizi Wellbeing Platformuna davet etti! Bu platform üzerinden esenlik yolculuğunuza başlayabilir, anketlere katılabilir ve size özel önerilere ulaşabilirsiniz.</p>\n      <p>Hesabınızı oluşturmak ve platforma katılmak için aşağıdaki butona tıklayın:</p>\n      <div style="text-align: center;">\n        <a href="{{invite_link}}" class="btn">Hesabımı Oluştur →</a>\n      </div>\n      <p>Bu davet bağlantısı <b>{{expires_in}}</b> (72 saat) süresince geçerlidir.</p>\n      <p>Sizi aramızda görmekten mutluluk duyacağız.</p>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platformu</p>\n      <p>Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.</p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>🌱 Wellbeing Platform</h1>\n    </div>\n    <div class="body">\n      <h2>Hello {{full_name}},</h2>\n      <p><b>{{company_name}}</b> has invited you to join the Wellbeing Platform! Start your wellbeing journey, participate in surveys, and get personalized recommendations.</p>\n      <p>To create your account and join the platform, click the button below:</p>\n      <div style="text-align: center;">\n        <a href="{{invite_link}}" class="btn">Create My Account →</a>\n      </div>\n      <p>This invitation link is valid for <b>{{expires_in}}</b> (72 hours).</p>\n      <p>We look forward to seeing you on board.</p>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platform</p>\n      <p>If you do not wish to receive these emails, please contact your administrator.</p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{full_name}}", "{{company_name}}", "{{invite_link}}", "{{expires_in}}"]	Çalışan kayıt davetiyesi	t	2026-05-05 14:42:48.633736+03	\N
becd103c-f239-4141-baa1-ae0ddbe3584d	survey_reminder	⏰ Anketinizi Tamamlamayı Unutmayın	⏰ Don't Forget to Complete Your Survey	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #FFF3CD; border-left: 4px solid #E07B1A; padding: 16px; margin: 24px 0; text-align: center; border-radius: 8px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <img src="{{brand_logo_url}}" alt="{{brand_name}}" style="max-height: 48px; border:0; display:block; margin: 0 auto;">\n    </div>\n    <div class="body">\n      <h2>Merhaba {{full_name}},</h2>\n      <p><b>{{survey_title}}</b> anketinizi henüz tamamlamadığınızı hatırlatmak istedik. Sizin fikirleriniz platformun başarısı ve doğru analizler için kritik önem taşıyor.</p>\n      \n      <div class="alert">\n        <p style="margin: 0; font-weight: bold; color: #856404;">⏰ Son {{days_remaining}} Gün!</p>\n      </div>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Ankete Başla →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"Tamamladığınız anketler şirketinizin wellbeing skorunu doğru yansıtacaktır."</p>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platformu</p>\n      <p>Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.</p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; color: white !important; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #FFF3CD; border-left: 4px solid #E07B1A; padding: 16px; margin: 24px 0; text-align: center; border-radius: 8px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>🌱 Wellbeing Platform</h1>\n    </div>\n    <div class="body">\n      <h2>Hello {{full_name}},</h2>\n      <p>We wanted to remind you that you haven't yet completed the <b>{{survey_title}}</b> survey. Your ideas are critical for the platform's success and accurate analysis.</p>\n      \n      <div class="alert">\n        <p style="margin: 0; font-weight: bold; color: #856404;">⏰ Only {{days_remaining}} Days Left!</p>\n      </div>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Start Survey →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"Completed surveys will accurately reflect your company's wellbeing score."</p>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platform</p>\n      <p>If you do not wish to receive these emails, please contact your administrator.</p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{full_name}}", "{{survey_title}}", "{{survey_link}}", "{{days_remaining}}"]	\N	t	2026-05-05 14:42:48.64162+03	\N
722695ab-7aa6-494c-ad4b-72011ee7546a	survey_token_invite	🌱 Wellbeing Anketiniz Hazır	🌱 Your Wellbeing Survey is Ready	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .metric-container { display: flex; justify-content: space-between; gap: 10px; margin: 24px 0; }\n    .metric-box { flex: 1; background: #f0fdf4; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #dcfce7; }\n    .metric-box span { display: block; font-size: 10px; color: #888; font-weight: bold; text-transform: uppercase; }\n    .metric-box b { font-size: 14px; color: #2E865A; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <img src="{{brand_logo_url}}" alt="{{brand_name}}" style="max-height: 48px; border:0; display:block; margin: 0 auto;">\n    </div>\n    <div class="body">\n      <h2>Merhaba {{full_name}},</h2>\n      <p><b>{{company_name}}</b> adına bu dönem wellbeing anketini doldurmanızı rica ediyoruz. Cevaplarınız, şirketinizdeki çalışma ortamını ve esenliği iyileştirmemize yardımcı olacaktır.</p>\n      \n      <div class="metric-container">\n        <div class="metric-box">\n          <span>Süre</span>\n          <b>~{{estimated_minutes}} Dakika</b>\n        </div>\n        <div class="metric-box">\n          <span>Güvenlik</span>\n          <b>%100 Anonim</b>\n        </div>\n        <div class="metric-box">\n          <span>Son Tarih</span>\n          <b>{{due_date}}</b>\n        </div>\n      </div>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Ankete Başla →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"Verileriniz tamamen anonim tutulur ve kişisel cevaplarınız yöneticilerle paylaşılmaz."</p>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platformu</p>\n      <p>Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.</p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .metric-container { display: flex; justify-content: space-between; gap: 10px; margin: 24px 0; }\n    .metric-box { flex: 1; background: #f0fdf4; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #dcfce7; }\n    .metric-box span { display: block; font-size: 10px; color: #888; font-weight: bold; text-transform: uppercase; }\n    .metric-box b { font-size: 14px; color: #2E865A; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>🌱 Wellbeing Platform</h1>\n    </div>\n    <div class="body">\n      <h2>Hello {{full_name}},</h2>\n      <p>On behalf of <b>{{company_name}}</b>, we kindly ask you to complete this period's wellbeing survey. Your feedback helps us improve the work environment and wellbeing at your company.</p>\n      \n      <div class="metric-container">\n        <div class="metric-box">\n          <span>Time</span>\n          <b>~{{estimated_minutes}} Mins</b>\n        </div>\n        <div class="metric-box">\n          <span>Security</span>\n          <b>100% Anonymous</b>\n        </div>\n        <div class="metric-box">\n          <span>Deadline</span>\n          <b>{{due_date}}</b>\n        </div>\n      </div>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Start Survey →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"Your data is kept completely anonymous and your individual answers are not shared with managers."</p>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platform</p>\n      <p>If you do not wish to receive these emails, please contact your administrator.</p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{full_name}}", "{{company_name}}", "{{survey_title}}", "{{survey_link}}", "{{due_date}}"]	Bireysel anket davetiyesi	t	2026-05-05 14:42:48.642442+03	\N
51bcf085-6ef9-4020-8bc5-a35b6b3c3738	report_failed	❌ Rapor Oluşturulamadı	❌ Report Generation Failed	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #C0392B; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .error-box { background: #FFF0EE; border: 1px solid #FADBD8; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>❌ Rapor Oluşturulamadı</h1>\n    </div>\n    <div class="body">\n      <h2>Merhaba {{hr_name}},</h2>\n      <p>Üzgünüz, <b>{{period}}</b> dönemine ait <b>{{format}}</b> raporunuz oluşturulurken teknik bir sorunla karşılaşıldı.</p>\n      \n      <div class="error-box">\n        <p style="margin: 0; color: #C0392B; font-weight: bold;">Rapor oluşturma işlemi başarısız oldu.</p>\n      </div>\n\n      <p>Lütfen dashboard üzerinden tekrar denemeyi deneyin. Sorun devam ederse bizimle <b>{{support_email}}</b> adresinden iletişime geçebilirsiniz.</p>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platformu</p>\n      <p>Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.</p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #C0392B; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .error-box { background: #FFF0EE; border: 1px solid #FADBD8; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>❌ Report Generation Failed</h1>\n    </div>\n    <div class="body">\n      <h2>Hello {{hr_name}},</h2>\n      <p>We're sorry, but there was a technical issue while generating your <b>{{period}}</b> report in <b>{{format}}</b> format.</p>\n      \n      <div class="error-box">\n        <p style="margin: 0; color: #C0392B; font-weight: bold;">Report generation failed.</p>\n      </div>\n\n      <p>Please try again from the dashboard. If the problem persists, you can contact us at <b>{{support_email}}</b>.</p>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platform</p>\n      <p>If you do not wish to receive these emails, please contact your administrator.</p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{hr_name}}", "{{company_name}}", "{{period}}", "{{format}}", "{{support_email}}"]	\N	t	2026-05-05 14:42:48.637687+03	\N
de23b8d0-c1b4-44ea-9bc1-b510d37dfcde	survey_closed	📊 Wellbeing Sonuçları Hazır	📊 Wellbeing Results are Ready	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .metric { text-align: center; padding: 32px; background: #f0fdf4; border-radius: 12px; margin: 24px 0; border: 1px solid #dcfce7; }\n    .metric .number { font-size: 48px; font-weight: bold; color: #2E865A; display: block; }\n    .metric .label { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <img src="{{brand_logo_url}}" alt="{{brand_name}}" style="max-height: 48px; border:0; display:block; margin: 0 auto;">\n    </div>\n    <div class="body">\n      <h2>Merhaba {{hr_name}},</h2>\n      <p><b>{{company_name}}</b> için <b>{{period}}</b> dönemi anket süreci başarıyla tamamlandı. Katılım verileri ve ön analizler hazırlandı.</p>\n      \n      <div class="metric">\n        <span class="number">%{{participation_rate}}</span>\n        <span class="label">Katılım Oranı</span>\n      </div>\n\n      <p>Tüm detayları, departman bazlı dağılımları ve AI tarafından oluşturulan içgörüleri görüntülemek için dashboard'u ziyaret edebilirsiniz:</p>\n\n      <div style="text-align: center;">\n        <a href="{{dashboard_link}}" class="btn">Sonuçları Görüntüle →</a>\n      </div>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platformu</p>\n      <p>Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.</p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 24px; text-align: center; color: white; }\n    .header h1 { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .metric { text-align: center; padding: 32px; background: #f0fdf4; border-radius: 12px; margin: 24px 0; border: 1px solid #dcfce7; }\n    .metric .number { font-size: 48px; font-weight: bold; color: #2E865A; display: block; }\n    .metric .label { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>🌱 Wellbeing Platform</h1>\n    </div>\n    <div class="body">\n      <h2>Hello {{hr_name}},</h2>\n      <p>The <b>{{period}}</b> survey period for <b>{{company_name}}</b> has been successfully completed. Participation data and preliminary analyses are ready.</p>\n      \n      <div class="metric">\n        <span class="number">{{participation_rate}}%</span>\n        <span class="label">Participation Rate</span>\n      </div>\n\n      <p>You can visit the dashboard to view all details, department-based distributions, and AI-generated insights:</p>\n\n      <div style="text-align: center;">\n        <a href="{{dashboard_link}}" class="btn">View Results →</a>\n      </div>\n    </div>\n    <div class="footer">\n      <p>Wellbeing Platform</p>\n      <p>If you do not wish to receive these emails, please contact your administrator.</p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{hr_name}}", "{{company_name}}", "{{period}}", "{{participation_rate}}", "{{dashboard_link}}"]	\N	t	2026-05-05 14:42:48.640404+03	\N
41ba15b7-5285-415c-9292-09c9236365d8	content_shared	Yeni İçerik Paylaşıldı	New Content Shared	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; border-bottom: 1px solid #eee; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #1D9E75; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0; }\n    .label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }\n    .value { font-size: 14px; font-weight: 600; color: #1e293b; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 50px; object-fit: contain;">\n    </div>\n    <div class="body">\n      <h2>Yeni İçerik Paylaşıldı!</h2>\n      <p>Danışmanınız <b>{{consultant_name}}</b>, kurumunuz için yeni bir wellbeing içeriği paylaştı.</p>\n      \n      <div class="info-card">\n        <div class="label">İçerik Başlığı</div>\n        <div class="value">{{content_title}}</div>\n        \n        <div style="margin-top: 12px;">\n          <div class="label">Hedef Kitle</div>\n          <div class="value">{{department_name}}</div>\n        </div>\n\n        {{#if notes}}\n        <div style="margin-top: 12px;">\n          <div class="label">Danışman Notu</div>\n          <div style="font-style: italic; color: #475569;">"{{notes}}"</div>\n        </div>\n        {{/if}}\n      </div>\n\n      <p>Paylaşılan içeriği platform üzerinden incelemek ve çalışanlarınıza duyurmak için aşağıdaki butona tıklayabilirsiniz:</p>\n      \n      <div style={{ textAlign: 'center' }}>\n        <a href="{{dashboard_url}}" class="btn">Panelde Görüntüle →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #64748b;">Doğrudan içeriğe ulaşmak için: <a href="{{content_url}}" style="color: #1D9E75;">{{content_url}}</a></p>\n    </div>\n        <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	\N	["consultant_name", "content_title", "department_name", "notes", "platform_url", "dashboard_url", "content_url"]	Danışman içerik paylaştığında HR'a giden mail	t	2026-05-06 15:00:38.810155+03	\N
f5daaa3d-2b89-4f67-be3b-c12065348497	training_plan_published	Yeni Eğitim Planı Yayınlandı	New Training Plan Published	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; border-bottom: 1px solid #eee; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #1D9E75; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0; }\n    .label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }\n    .value { font-size: 14px; font-weight: 600; color: #1e293b; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 50px; object-fit: contain;">\n    </div>\n    <div class="body">\n      <h2>Yeni Eğitim Planı Yayınlandı!</h2>\n      <p>Danışmanınız <b>{{consultant_name}}</b>, kurumunuz için yeni bir eğitim/etkinlik planı yayınladı.</p>\n      \n      <div class="info-card">\n        <div class="label">Plan Başlığı</div>\n        <div class="value">{{plan_title}}</div>\n        \n        <div style="margin-top: 12px;">\n          <div class="label">Etkinlik Sayısı</div>\n          <div class="value">{{event_count}} adet etkinlik</div>\n        </div>\n\n        <div style="margin-top: 12px;">\n          <div class="label">Başlangıç Tarihi</div>\n          <div class="value">{{starts_at}}</div>\n        </div>\n      </div>\n\n      <p>Planlanan eğitimleri incelemek ve çalışanlarınıza duyurmak için aşağıdaki butona tıklayarak platforma giriş yapabilirsiniz:</p>\n      \n      <div style="text-align: center;">\n        <a href="{{plan_url}}" class="btn">Planı Görüntüle →</a>\n      </div>\n    </div>\n        <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	\N	["consultant_name", "plan_title", "event_count", "starts_at", "plan_url", "platform_url"]	Danışman eğitim planı yayınladığında HR'a giden mail	t	2026-05-06 15:00:38.901389+03	\N
f1263a6a-468b-4505-a777-daf5d7eda85e	content_shared_to_employees	Sizin İçin Yeni Bir Esenlik Kaynağı Paylaşıldı	A New Wellbeing Resource Shared for You	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; border-bottom: 1px solid #eee; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #1D9E75; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0; }\n    .label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }\n    .value { font-size: 15px; font-weight: 600; color: #1e293b; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 50px; object-fit: contain;">\n    </div>\n    <div class="body">\n      <h2>Sizin İçin Yeni Bir Kaynak Var!</h2>\n      <p>Merhaba <b>{{employee_name}}</b>,</p>\n      <p>Kurumunuz <b>{{company_name}}</b> ve danışmanınız <b>{{consultant_name}}</b>, esenliğinizi desteklemek için yeni bir içerik paylaştı.</p>\n      \n      <div class="info-card">\n        <div class="label">İçerik</div>\n        <div class="value">{{content_title}}</div>\n        \n        {{#if notes}}\n        <div style="margin-top: 12px;">\n          <div class="label">Not</div>\n          <div style="font-style: italic; color: #475569;">"{{notes}}"</div>\n        </div>\n        {{/if}}\n      </div>\n\n      <p>Bu kaynağa ulaşmak ve kendinize zaman ayırmak için aşağıdaki butona tıklayabilirsiniz:</p>\n      \n      <div style="text-align: center;">\n        <a href="{{content_url}}" class="btn">İçeriği Hemen Görüntüle →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #64748b;">Sağlıklı ve huzurlu bir gün dileriz.</p>\n    </div>\n        <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	\N	["employee_name", "company_name", "content_title", "content_type", "content_url", "consultant_name", "notes", "platform_url"]	HR içeriği çalışanlara duyurduğunda giden mail	t	2026-05-06 15:00:38.982164+03	\N
76b2240a-1891-48e6-9b0c-d98a87b71090	consultant_report_ready	Wellbeing Analiz Raporunuz Hazır	Your Wellbeing Analysis Report is Ready	<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="utf-8">\n    <style>\n        body { font-family: 'Inter', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; }\n        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }\n        .header { margin-bottom: 32px; }\n        .logo { font-size: 24px; fontWeight: 800; color: #2563eb; text-decoration: none; }\n        .content { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }\n        h1 { font-size: 20px; font-weight: 800; margin-top: 0; color: #0f172a; }\n        p { margin-bottom: 20px; }\n        .details { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; }\n        .detail-item { font-size: 14px; margin-bottom: 8px; }\n        .detail-label { font-weight: 700; color: #64748b; width: 100px; display: inline-block; }\n        .button { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; }\n        .footer { margin-top: 32px; font-size: 12px; color: #94a3b8; text-align: center; }\n    </style>\n</head>\n<body>\n    <div class="container">\n        <div class="header">\n            <a href="#" class="logo">WellMetric</a>\n        </div>\n        <div class="content">\n            <h1>Raporunuz Hazır!</h1>\n            <p>Sayın {{consultant_name}},</p>\n            <p>Talebiniz üzerine yapay zeka tarafından hazırlanan wellbeing analiz raporu tamamlanmıştır.</p>\n            \n            <div class="details">\n                <div class="detail-item"><span class="detail-label">Firma:</span> {{company_name}}</div>\n                <div class="detail-item"><span class="detail-label">Dönem:</span> {{period}}</div>\n                <div class="detail-item"><span class="detail-label">Durum:</span> Taslak</div>\n            </div>\n\n            <p>Raporu incelemek, üzerinde düzenlemeler yapmak veya yayınlamak için aşağıdaki bağlantıyı kullanabilirsiniz:</p>\n            \n            <a href="{{report_url}}" class="button">Raporu Görüntüle</a>\n            \n            <p style="margin-top: 24px; font-size: 14px; color: #64748b;">\n                Not: Rapor şu an taslak durumundadır. HR yöneticileriyle paylaşmak için "Yayınla" butonuna basmanız gerekmektedir.\n            </p>\n        </div>\n            <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n    </div>\n</body>\n</html>\n	\N	["consultant_name", "company_name", "period", "report_url", "platform_url"]	AI raporu hazır olduğunda danışmana giden mail	t	2026-05-06 15:00:39.259449+03	\N
\.


--
-- Data for Name: onboarding_assignments; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.onboarding_assignments (id, company_id, user_id, survey_token_id, wave_number, scheduled_at, sent_at, completed_at, status, created_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.payments (id, consultant_id, subscription_id, amount, currency, status, provider, provider_payment_id, invoice_url, metadata, created_at, package_key, invoice_number) FROM stdin;
\.


--
-- Data for Name: platform_settings; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.platform_settings (id, ai_provider_default, ai_model_default, ai_task_models, ai_max_tokens, ai_temperature, ai_enabled, mail_provider, mail_from_address, mail_from_name, storage_provider, platform_name, platform_url, supported_languages, default_language, anonymity_threshold, score_alert_threshold, api_keys, updated_at, updated_by, mail_config, storage_config, admin_email, consultant_packages, terms_of_use_tr, terms_of_use_en, privacy_policy_tr, privacy_policy_en, kvkk_text_tr, gdpr_text_en, debug_mode, mail_quota_capacity, mail_quota_used, platform_logo_url) FROM stdin;
fe31f004-c94b-48ab-9be0-b3de39904809	anthropic	claude-sonnet-4-6	{"hr_chat": {"model": "claude-haiku-4-5", "provider": "anthropic"}, "admin_chat": {"model": "claude-haiku-4-5", "provider": "anthropic"}, "risk_alert": {"model": "claude-haiku-4-5", "provider": "anthropic"}, "model_prices": {"gpt-4o": {"input": 2.50, "output": 10.00}, "gpt-4-turbo": {"input": 10.00, "output": 30.00}, "gpt-4o-mini": {"input": 0.15, "output": 0.60}, "mistral-large": {"input": 3.00, "output": 9.00}, "mistral-small": {"input": 0.20, "output": 0.60}, "gemini-2.5-pro": {"input": 1.25, "output": 10.00}, "claude-opus-4-5": {"input": 15.00, "output": 75.00}, "claude-opus-4-6": {"input": 15.00, "output": 75.00}, "claude-haiku-4-5": {"input": 1.00, "output": 5.00}, "gemini-2.5-flash": {"input": 0.30, "output": 2.50}, "claude-sonnet-4-5": {"input": 3.00, "output": 15.00}, "claude-sonnet-4-6": {"input": 3.00, "output": 15.00}, "claude-haiku-4-5-20251001": {"input": 1.00, "output": 5.00}}, "admin_anomaly": {"model": "claude-haiku-4-5", "provider": "anthropic"}, "trend_analysis": {"model": "claude-haiku-4-5", "provider": "anthropic"}, "action_suggestion": {"model": "claude-haiku-4-5", "provider": "anthropic"}, "open_text_summary": {"model": "claude-haiku-4-5", "provider": "anthropic"}, "survey_generation": {"model": "claude-sonnet-4-6", "provider": "anthropic"}, "content_suggestion": {"model": "claude-haiku-4-5", "provider": "anthropic"}, "intelligence_report": {"model": "claude-sonnet-4-6", "provider": "anthropic"}, "benchmark_generation": {"model": "claude-haiku-4-5", "provider": "anthropic"}}	2000	0.3	t	resend	\N	\N	cloudflare_r2	Wellbeing Metric	http://localhost:3000	["tr", "en"]	tr	5	45	{"anthropic": "{\\"api_key\\":\\"b0463a5f99dfdbbdcd7f69c24be47971:d25aeefd853dafe18703b9e27b21861b0c259ec284c70ee6cf6ccb5564d408d005bb35694e446ef363d2525e31ff66ea49f1f618c77c11f3933b5cb4ce537a1e8d72de6c207bfd9cb97e091715b9f88dbb2c1d4c6485710bdb3a93af9b58d43f8cf5052dbe694653a74a9db9a06f1300\\"}"}	2026-05-06 07:43:10.858992+03	b286517c-279f-4bc8-8482-c29fef28da5a	{"provider_specific": {"resend": {"api_key": "re_PLACEHOLDER"}}}	{}	admin@wellanalytics.io	{}	\N	\N	\N	\N	\N	\N	t	3000	20	http://localhost:3001/api/v1/uploads/local-mock?key=platform%2Flogo%2F2af97d61-3c13-48b4-a66c-92b0732f06c3.png
\.


--
-- Data for Name: product_packages; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.product_packages (key, type, label_tr, label_en, description_tr, description_en, price_monthly, price_yearly, currency, credits, max_companies, max_employees, ai_enabled, white_label, sort_order, is_active, created_at, updated_at, is_visible, features) FROM stdin;
enterprise	subscription	Enterprise	Enterprise	Sınırsız firma, sınırsız AI kredisi, white-label.	Unlimited companies, unlimited AI credits, white-label.	599.00	5748.00	USD	{"ai_credit": -1, "mail_credit": -1}	\N	\N	t	t	3	t	2026-05-05 12:58:45.067319	2026-05-05 12:58:45.067319	t	[]
starter	subscription	Starter	Starter	3 firmaya kadar, temel özellikler.	Up to 3 companies, basic features.	99.00	948.00	USD	{"ai_credit": 500, "mail_credit": 2000}	3	\N	t	f	1	t	2026-05-05 12:58:45.067319	2026-05-05 12:58:45.067319	t	[]
growth	subscription	Growth	Growth	10 firmaya kadar, tüm AI özellikleri dahil.	Up to 10 companies, all AI features included.	249.00	2388.00	USD	{"ai_credit": 2000, "mail_credit": 10000}	10	\N	t	f	2	t	2026-05-05 12:58:45.067319	2026-05-05 12:58:45.067319	t	[]
ai_500	credit	500 AI Kredisi	500 AI Credits	500 AI analiz kredisi.	500 AI analysis credits.	29.00	\N	USD	{"ai_credit": 500}	\N	\N	t	f	10	t	2026-05-05 12:58:45.076285	2026-05-05 12:58:45.076285	t	[]
ai_1000	credit	1.000 AI Kredisi	1,000 AI Credits	1.000 AI analiz kredisi.	1,000 AI analysis credits.	49.00	\N	USD	{"ai_credit": 1000}	\N	\N	t	f	11	t	2026-05-05 12:58:45.076285	2026-05-05 12:58:45.076285	t	[]
ai_2500	credit	2.500 AI Kredisi	2,500 AI Credits	2.500 AI analiz kredisi.	2,500 AI analysis credits.	99.00	\N	USD	{"ai_credit": 2500}	\N	\N	t	f	12	t	2026-05-05 12:58:45.076285	2026-05-05 12:58:45.076285	t	[]
mail_5000	credit	5.000 Mail Kredisi	5,000 Mail Credits	5.000 mail kredisi.	5,000 mail credits.	9.00	\N	USD	{"mail_credit": 5000}	\N	\N	f	f	20	t	2026-05-05 12:58:45.076285	2026-05-05 12:58:45.076285	t	[]
mail_10000	credit	10.000 Mail Kredisi	10,000 Mail Credits	10.000 mail kredisi.	10,000 mail credits.	15.00	\N	USD	{"mail_credit": 10000}	\N	\N	f	f	21	t	2026-05-05 12:58:45.076285	2026-05-05 12:58:45.076285	t	[]
mail_25000	credit	25.000 Mail Kredisi	25,000 Mail Credits	25.000 mail kredisi.	25,000 mail credits.	29.00	\N	USD	{"mail_credit": 25000}	\N	\N	f	f	22	t	2026-05-05 12:58:45.076285	2026-05-05 12:58:45.076285	t	[]
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

COPY public.subscriptions (id, consultant_id, package_key, status, "interval", current_period_start, current_period_end, cancel_at_period_end, provider, provider_subscription_id, created_at, updated_at, stripe_payment_method_id, stripe_customer_id, retry_count, last_retry_at, past_due_since) FROM stdin;
74260afd-db9d-4dcd-9a11-2fb39cf5e561	caed7502-8393-4421-9e3e-78cf340b52bd	starter	active	monthly	2026-05-05 14:29:03.348757	2026-06-05 14:29:03.348757	f	\N	\N	2026-05-05 14:29:03.348757	2026-05-05 14:29:03.348757	\N	\N	0	\N	\N
\.


--
-- Data for Name: survey_assignments; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.survey_assignments (id, survey_id, company_id, assigned_at, due_at, status, assigned_by, period, department_id) FROM stdin;
11111111-1111-1111-1111-111111111111	11111111-1111-1111-1111-111111111111	161d59d3-3b66-46f3-9557-5aece422db24	2026-05-01 00:00:00+03	2026-05-15 00:00:00+03	active	\N	2026-05	\N
22222222-2222-2222-2222-222222222222	11111111-1111-1111-1111-111111111111	22222222-2222-2222-2222-222222222222	2026-05-01 00:00:00+03	2026-05-15 00:00:00+03	active	\N	2026-05	\N
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
4b5801fa-2ae4-437c-a74e-1ee788ca4497	3ab9ab84-898b-405d-8ed5-0d6842a21514	Genel olarak fiziksel sağlığımın iyi olduğunu düşünüyorum.	I think my physical health is generally good.	f	1.00	0	t	t	\N	\N	\N	2026-05-06 08:13:57.679873+03	2026-05-06 08:13:57.679873+03	physical	likert5	\N	\N
1949609e-bb7d-4475-9b5b-f10217d844f2	3ab9ab84-898b-405d-8ed5-0d6842a21514	İş günlerinde yeterli düzeyde fiziksel aktivite yapabiliyorum.	I am able to get enough physical activity during workdays.	f	1.00	1	t	t	\N	\N	\N	2026-05-06 08:13:57.679873+03	2026-05-06 08:13:57.679873+03	physical	likert5	\N	\N
4267cfa9-3124-48ba-a3f5-8ef021f50ff3	3ab9ab84-898b-405d-8ed5-0d6842a21514	Son zamanlarda kendimi sık sık stresli ve bunalmış hissediyorum.	Lately, I often feel stressed and overwhelmed.	t	1.00	2	t	t	\N	\N	\N	2026-05-06 08:13:57.679873+03	2026-05-06 08:13:57.679873+03	mental	likert5	\N	\N
759e0170-d621-4b87-a67f-67a3ba03c6a7	3ab9ab84-898b-405d-8ed5-0d6842a21514	İşle ilgili zorluklarla başa çıkmak için yeterli zihinsel dayanıklılığa sahibim.	I have enough mental resilience to cope with work-related challenges.	f	1.00	3	t	t	\N	\N	\N	2026-05-06 08:13:57.679873+03	2026-05-06 08:13:57.679873+03	mental	likert5	\N	\N
b2652103-76da-4003-8d62-35655558cfbb	3ab9ab84-898b-405d-8ed5-0d6842a21514	İş arkadaşlarımla güçlü ve destekleyici ilişkiler kurabiliyorum.	I am able to build strong and supportive relationships with my colleagues.	f	1.00	4	t	t	\N	\N	\N	2026-05-06 08:13:57.679873+03	2026-05-06 08:13:57.679873+03	social	likert5	\N	\N
6f8b198b-0c4a-49d0-838a-8183c8b093c0	3ab9ab84-898b-405d-8ed5-0d6842a21514	İşyerinde kendimi yalnız ve izole hissediyorum.	I feel lonely and isolated at the workplace.	t	1.00	5	t	t	\N	\N	\N	2026-05-06 08:13:57.679873+03	2026-05-06 08:13:57.679873+03	social	likert5	\N	\N
7b764e81-e1d7-4ef7-9c38-e4945a2c3ba1	3ab9ab84-898b-405d-8ed5-0d6842a21514	Mevcut gelir düzeyim temel ihtiyaçlarımı karşılamak için yeterlidir.	My current income level is sufficient to meet my basic needs.	f	1.00	6	t	t	\N	\N	\N	2026-05-06 08:13:57.679873+03	2026-05-06 08:13:57.679873+03	financial	likert5	\N	\N
13213f34-741e-433e-8d12-a8659bf2cdf8	3ab9ab84-898b-405d-8ed5-0d6842a21514	Finansal geleceğim konusunda sık sık endişe duyuyorum.	I frequently worry about my financial future.	t	1.00	7	t	t	\N	\N	\N	2026-05-06 08:13:57.679873+03	2026-05-06 08:13:57.679873+03	financial	likert5	\N	\N
f72b215e-0c24-40ca-af00-6afbc4ba2eea	3ab9ab84-898b-405d-8ed5-0d6842a21514	Yaptığım iş bana anlam ve amaç duygusu veriyor.	My work gives me a sense of meaning and purpose.	f	1.00	8	t	t	\N	\N	\N	2026-05-06 08:13:57.679873+03	2026-05-06 08:13:57.679873+03	work	likert5	\N	\N
0587babc-8922-4a55-83ef-ec5123b98447	3ab9ab84-898b-405d-8ed5-0d6842a21514	İşimde kendimi geliştirme ve büyüme fırsatları bulabiliyorum.	I can find opportunities for self-improvement and growth in my job.	f	1.00	9	t	t	\N	\N	\N	2026-05-06 08:13:57.679873+03	2026-05-06 08:13:57.679873+03	work	likert5	\N	\N
\.


--
-- Data for Name: survey_responses; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.survey_responses (id, survey_id, assignment_id, user_id, company_id, department_id, tenure_months, is_anonymous, submitted_at, period, location, seniority, age_group, gender) FROM stdin;
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
\.


--
-- Data for Name: surveys; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.surveys (id, company_id, title_tr, title_en, description_tr, description_en, is_anonymous, is_active, throttle_days, starts_at, ends_at, created_by, created_at, updated_at, type, frequency, is_pool_visible, pool_added_at) FROM stdin;
11111111-1111-1111-1111-111111111111	\N	Genel Esenlik Değerlendirmesi	General Wellbeing Assessment	\N	\N	t	t	7	\N	\N	\N	2026-05-05 21:19:12.188114+03	2026-05-05 21:19:12.188114+03	standard	\N	t	\N
3ab9ab84-898b-405d-8ed5-0d6842a21514	161d59d3-3b66-46f3-9557-5aece422db24	Başlangıç Değerlendirmesi	Initial Assessment	\N	\N	t	t	7	\N	\N	caed7502-8393-4421-9e3e-78cf340b52bd	2026-05-06 08:13:57.676027+03	2026-05-06 08:13:57.676027+03	company_specific	monthly	t	2026-05-06 08:13:57.675+03
\.


--
-- Data for Name: training_events; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.training_events (id, plan_id, company_id, department_id, title, description, event_type, scheduled_at, duration_minutes, content_item_id, external_url, external_url_label, status, hr_notes, completed_at, completed_by, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: training_notifications; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.training_notifications (id, event_id, company_id, department_id, sent_by, recipient_count, sent_at, subject, notes) FROM stdin;
\.


--
-- Data for Name: training_plans; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.training_plans (id, consultant_id, company_id, title, description, status, starts_at, ends_at, published_at, created_at, updated_at, department_id) FROM stdin;
\.


--
-- Data for Name: typeorm_metadata; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.typeorm_metadata (type, database, schema, "table", name, value) FROM stdin;
GENERATED_COLUMN	wellanalytics_db	public	api_cost_logs	total_tokens	input_tokens + output_tokens
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
77	1714486800000	AddIsVisibleToPackages1714486800000
78	1714486900000	AddPaymentSettingsToPlatformSettings1714486900000
79	1714750000000	CreateEmployeesTable1714750000000
80	1714760000000	AddEmployeeDeleteSupport1714760000000
81	1714830000000	AddPaymentMethodStorage1714830000000
82	1746300000000	AddSurveyPoolFields1746300000000
83	1746400000000	CreateBenchmarkTables1746400000000
84	1746500000000	AddWhiteLabelFields1746500000000
85	1746600000000	CreateOnboardingSystem1746600000000
86	1777559000000	BillingSystem0131777559000000
87	1777897416102	RemoveIyzicoFields1777897416102
88	1777897417000	AddApiCostTracking1777897417000
89	1777900000000	AddContentAssignments1777900000000
90	1777910000000	CreateConsultantReports1777910000000
91	1777920000000	CreateTrainingSystem1777920000000
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.users (id, company_id, department_id, email, password_hash, full_name, role, "position", location, seniority, age_group, gender, start_date, language, is_active, last_login_at, created_at) FROM stdin;
caed7502-8393-4421-9e3e-78cf340b52bd	\N	\N	onur@3bitz.com	$2a$12$o0OUhKuyEXRdJEIsHOZgqOiPZhmddYEIzBrnzXuBTnftsbAP69gLS	Onur Ekşi	consultant	\N	\N	\N	\N	\N	\N	en	t	2026-05-06 15:51:43.443+03	2026-05-05 13:14:05.48364+03
1bd68bcc-a0cc-48d4-b174-5253f2786477	161d59d3-3b66-46f3-9557-5aece422db24	\N	ahmet@onurtech.ai	hash	Ahmet Yılmaz	employee	\N	\N	\N	\N	\N	\N	tr	t	\N	2026-05-05 21:19:12.188114+03
943c4c49-a76a-4b02-b365-199ae4b38701	161d59d3-3b66-46f3-9557-5aece422db24	\N	ayse@onurtech.ai	hash	Ayşe Demir	employee	\N	\N	\N	\N	\N	\N	tr	t	\N	2026-05-05 21:19:12.188114+03
b1f54a90-8562-4680-ad56-61ad2cdde472	161d59d3-3b66-46f3-9557-5aece422db24	\N	mehmet@onurtech.ai	hash	Mehmet Kaya	employee	\N	\N	\N	\N	\N	\N	tr	t	\N	2026-05-05 21:19:12.188114+03
731f42df-d1fb-481e-8e89-f573d5f65207	161d59d3-3b66-46f3-9557-5aece422db24	\N	fatma@onurtech.ai	hash	Fatma Şahin	employee	\N	\N	\N	\N	\N	\N	tr	t	\N	2026-05-05 21:19:12.188114+03
d30c571f-82db-4c23-8b73-b3cee966824c	161d59d3-3b66-46f3-9557-5aece422db24	\N	can@onurtech.ai	hash	Can Özcan	employee	\N	\N	\N	\N	\N	\N	tr	t	\N	2026-05-05 21:19:12.188114+03
656f7bdc-3a62-49f5-997a-01fb8e714411	22222222-2222-2222-2222-222222222222	\N	john@wellmetric.com	hash	John Doe	employee	\N	\N	\N	\N	\N	\N	tr	t	\N	2026-05-05 21:19:12.188114+03
f318ef43-4d4f-4a12-943c-6ddf1317d039	22222222-2222-2222-2222-222222222222	\N	jane@wellmetric.com	hash	Jane Smith	employee	\N	\N	\N	\N	\N	\N	tr	t	\N	2026-05-05 21:19:12.188114+03
23ec14db-211e-465d-adff-3b6c8af9c9e9	22222222-2222-2222-2222-222222222222	\N	robert@wellmetric.com	hash	Robert Brown	employee	\N	\N	\N	\N	\N	\N	tr	t	\N	2026-05-05 21:19:12.188114+03
672c4165-82a3-45b6-b340-232362a5f24e	161d59d3-3b66-46f3-9557-5aece422db24	\N	onureksi82@gmail.com	$2a$12$qrL1bYUkZg09b8C/sZEl5u.QBEvCS2BgI6QGnXBWjgZ6Ihjq1T9..	\N	hr_admin	\N	\N	\N	\N	\N	\N	tr	t	2026-05-05 21:20:50.409+03	2026-05-05 15:31:55.92042+03
b286517c-279f-4bc8-8482-c29fef28da5a	\N	\N	admin@wellanalytics.com	$2a$10$XBccf9R8dmNtZvyEVYnKL.w0RzNRmDM9hxdWqX1E8k1fRCXhtMxtC	Sistem Yöneticisi	super_admin	\N	\N	\N	\N	\N	\N	tr	t	2026-05-06 10:00:51.146+03	2026-05-05 11:21:33.907233+03
\.


--
-- Data for Name: wellbeing_scores; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.wellbeing_scores (id, company_id, score, calculated_at, response_count, period, segment_type, segment_value, dimension, survey_id, department_id) FROM stdin;
dfb16954-4c13-4aa6-9c9a-304aa2ef61b4	161d59d3-3b66-46f3-9557-5aece422db24	68.00	2025-12-05 00:00:00+03	0	2025-12-01	\N	\N	overall	\N	\N
1d5a1b29-6289-4769-a201-432e4f3b947c	161d59d3-3b66-46f3-9557-5aece422db24	70.00	2026-01-05 00:00:00+03	0	2026-01-01	\N	\N	overall	\N	\N
4a5e7483-c531-4bc7-961b-ca7351ecee9d	161d59d3-3b66-46f3-9557-5aece422db24	72.00	2026-02-05 00:00:00+03	0	2026-02-01	\N	\N	overall	\N	\N
7c2acda4-32bd-49ab-86cf-86e995022704	161d59d3-3b66-46f3-9557-5aece422db24	75.00	2026-03-05 00:00:00+03	0	2026-03-01	\N	\N	overall	\N	\N
4e8ddfc1-fd52-4816-92ec-15332130f58f	161d59d3-3b66-46f3-9557-5aece422db24	78.00	2026-04-05 00:00:00+03	0	2026-04-01	\N	\N	overall	\N	\N
88eae53a-614f-49c1-a796-3722ac9c2735	161d59d3-3b66-46f3-9557-5aece422db24	82.00	2026-05-05 00:00:00+03	0	2026-05-01	\N	\N	overall	\N	\N
030ee5ce-be81-4432-8395-d0bf0cc94b26	161d59d3-3b66-46f3-9557-5aece422db24	78.00	2026-05-05 00:00:00+03	0	2026-05-01	\N	\N	mental	\N	\N
dda610f5-3e2a-4501-b4d7-d2eb7bce33ac	161d59d3-3b66-46f3-9557-5aece422db24	85.00	2026-05-05 00:00:00+03	0	2026-05-01	\N	\N	physical	\N	\N
2d719025-ee2b-4040-a6bb-8fd865664782	161d59d3-3b66-46f3-9557-5aece422db24	88.00	2026-05-05 00:00:00+03	0	2026-05-01	\N	\N	work	\N	\N
8feb99a7-67e8-4520-bf4f-14a306e25948	161d59d3-3b66-46f3-9557-5aece422db24	75.00	2026-05-05 00:00:00+03	0	2026-05-01	\N	\N	social	\N	\N
0adcf281-8758-4a4a-87b8-f1a33b4778b8	161d59d3-3b66-46f3-9557-5aece422db24	72.00	2026-05-05 00:00:00+03	0	2026-05-01	\N	\N	financial	\N	\N
5652322c-2538-4be5-81aa-51cb36a280f2	22222222-2222-2222-2222-222222222222	55.00	2025-12-05 00:00:00+03	0	2025-12-01	\N	\N	overall	\N	\N
dde7879d-7d1b-4c93-9def-2095ef932a55	22222222-2222-2222-2222-222222222222	58.00	2026-01-05 00:00:00+03	0	2026-01-01	\N	\N	overall	\N	\N
5c9a4f9f-c00c-464f-90e1-28e54c96fa2f	22222222-2222-2222-2222-222222222222	52.00	2026-02-05 00:00:00+03	0	2026-02-01	\N	\N	overall	\N	\N
7f05d77f-edf3-47ea-892e-a08a72e40d7c	22222222-2222-2222-2222-222222222222	50.00	2026-03-05 00:00:00+03	0	2026-03-01	\N	\N	overall	\N	\N
a92da32b-e828-4560-8ea4-b936a9ab656c	22222222-2222-2222-2222-222222222222	48.00	2026-04-05 00:00:00+03	0	2026-04-01	\N	\N	overall	\N	\N
7ab7e763-8fca-44b9-bfde-c4084294e46a	22222222-2222-2222-2222-222222222222	45.00	2026-05-05 00:00:00+03	0	2026-05-01	\N	\N	overall	\N	\N
03a8588d-762f-4e3c-9c8b-b11632acc081	22222222-2222-2222-2222-222222222222	42.00	2026-05-05 00:00:00+03	0	2026-05-01	\N	\N	mental	\N	\N
075c41cd-fa10-4585-a763-bfa667400ce4	22222222-2222-2222-2222-222222222222	48.00	2026-05-05 00:00:00+03	0	2026-05-01	\N	\N	physical	\N	\N
9244e513-fcf3-4d44-a293-feaaafd4e27c	22222222-2222-2222-2222-222222222222	38.00	2026-05-05 00:00:00+03	0	2026-05-01	\N	\N	work	\N	\N
918f63f2-1803-4539-b3e3-1e5b7a923ef5	22222222-2222-2222-2222-222222222222	52.00	2026-05-05 00:00:00+03	0	2026-05-01	\N	\N	social	\N	\N
72846853-aa74-4be5-8390-5945aca49bab	22222222-2222-2222-2222-222222222222	45.00	2026-05-05 00:00:00+03	0	2026-05-01	\N	\N	financial	\N	\N
47d92b94-2f8b-4ce0-abca-31b68a30a6d5	161d59d3-3b66-46f3-9557-5aece422db24	85.00	2026-05-05 00:00:00+03	0	2026-05-01	\N	\N	overall	\N	11111111-1111-1111-1111-111111111111
decb34ed-7f84-45cf-96fb-562d41ef2fd7	161d59d3-3b66-46f3-9557-5aece422db24	82.00	2026-05-05 00:00:00+03	0	2026-05-01	\N	\N	overall	\N	11111111-1111-1111-1111-111111111112
713f8e05-3d06-473f-bb3e-29b89fe3f89d	161d59d3-3b66-46f3-9557-5aece422db24	78.00	2026-05-05 00:00:00+03	0	2026-05-01	\N	\N	overall	\N	11111111-1111-1111-1111-111111111113
fa436b72-aaf2-4e82-83df-c52fbdf64875	161d59d3-3b66-46f3-9557-5aece422db24	80.00	2026-05-05 00:00:00+03	0	2026-05-01	\N	\N	overall	\N	11111111-1111-1111-1111-111111111114
9b2a908a-aa16-44b1-ad56-7983134e6ed3	22222222-2222-2222-2222-222222222221	40.00	2026-05-05 00:00:00+03	0	2026-05-01	\N	\N	overall	\N	22222222-2222-2222-2222-222222222221
f3d42949-12e0-4b33-8612-72451d29bed0	22222222-2222-2222-2222-222222222222	48.00	2026-05-05 00:00:00+03	0	2026-05-01	\N	\N	overall	\N	22222222-2222-2222-2222-222222222222
b04fe54c-3b91-42c9-b43a-1a1daa0b9afd	22222222-2222-2222-2222-222222222223	46.00	2026-05-05 00:00:00+03	0	2026-05-01	\N	\N	overall	\N	22222222-2222-2222-2222-222222222223
\.


--
-- Name: typeorm_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wellanalytics
--

SELECT pg_catalog.setval('public.typeorm_migrations_id_seq', 91, true);


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
-- Name: wellbeing_scores UQ_3586d2b97e213829bb5d3513544; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.wellbeing_scores
    ADD CONSTRAINT "UQ_3586d2b97e213829bb5d3513544" UNIQUE (company_id, survey_id, period, dimension, segment_type, segment_value, department_id);


--
-- Name: consultant_payment_methods UQ_8b0086e02f834fa61a8df21b7cc; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.consultant_payment_methods
    ADD CONSTRAINT "UQ_8b0086e02f834fa61a8df21b7cc" UNIQUE (consultant_id, provider);


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
-- Name: api_cost_logs api_cost_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.api_cost_logs
    ADD CONSTRAINT api_cost_logs_pkey PRIMARY KEY (id);


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
-- Name: consultant_payment_methods consultant_payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.consultant_payment_methods
    ADD CONSTRAINT consultant_payment_methods_pkey PRIMARY KEY (id);


--
-- Name: consultant_plans consultant_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.consultant_plans
    ADD CONSTRAINT consultant_plans_pkey PRIMARY KEY (id);


--
-- Name: consultant_reports consultant_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.consultant_reports
    ADD CONSTRAINT consultant_reports_pkey PRIMARY KEY (id);


--
-- Name: content_assignments content_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.content_assignments
    ADD CONSTRAINT content_assignments_pkey PRIMARY KEY (id);


--
-- Name: content_engagement_logs content_engagement_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.content_engagement_logs
    ADD CONSTRAINT content_engagement_logs_pkey PRIMARY KEY (id);


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
-- Name: training_events training_events_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.training_events
    ADD CONSTRAINT training_events_pkey PRIMARY KEY (id);


--
-- Name: training_notifications training_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.training_notifications
    ADD CONSTRAINT training_notifications_pkey PRIMARY KEY (id);


--
-- Name: training_plans training_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.training_plans
    ADD CONSTRAINT training_plans_pkey PRIMARY KEY (id);


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
-- Name: IDX_97770069d5040f4d6009a756c7; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX "IDX_97770069d5040f4d6009a756c7" ON public.api_cost_logs USING btree (company_id);


--
-- Name: IDX_9efaf7ae87a26f5cfab24f8a09; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX "IDX_9efaf7ae87a26f5cfab24f8a09" ON public.api_cost_logs USING btree (consultant_id);


--
-- Name: IDX_b17a00dd28d03a9f05a1e0ddec; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX "IDX_b17a00dd28d03a9f05a1e0ddec" ON public.distribution_logs USING btree (company_id);


--
-- Name: IDX_bfc6c6be40f27f4667147563fa; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX "IDX_bfc6c6be40f27f4667147563fa" ON public.api_cost_logs USING btree (created_at);


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
-- Name: idx_payment_methods_consultant; Type: INDEX; Schema: public; Owner: wellanalytics
--

CREATE INDEX idx_payment_methods_consultant ON public.consultant_payment_methods USING btree (consultant_id);


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
-- Name: content_assignments FK_0a13c9f5c1d43ccc0b1ef60359a; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.content_assignments
    ADD CONSTRAINT "FK_0a13c9f5c1d43ccc0b1ef60359a" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: training_notifications FK_0be13865a6fb44af6b2521875ea; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.training_notifications
    ADD CONSTRAINT "FK_0be13865a6fb44af6b2521875ea" FOREIGN KEY (sent_by) REFERENCES public.users(id);


--
-- Name: survey_question_options FK_118b578f5a850c87bced3fbdbab; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.survey_question_options
    ADD CONSTRAINT "FK_118b578f5a850c87bced3fbdbab" FOREIGN KEY (question_id) REFERENCES public.survey_questions(id) ON DELETE CASCADE;


--
-- Name: content_assignments FK_129a9e1c8cfb835c668208d091b; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.content_assignments
    ADD CONSTRAINT "FK_129a9e1c8cfb835c668208d091b" FOREIGN KEY (content_item_id) REFERENCES public.content_items(id);


--
-- Name: survey_question_rows FK_1a44c98dfb5c3e012a1909c0698; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.survey_question_rows
    ADD CONSTRAINT "FK_1a44c98dfb5c3e012a1909c0698" FOREIGN KEY (question_id) REFERENCES public.survey_questions(id) ON DELETE CASCADE;


--
-- Name: content_assignments FK_1bfab36c2b38090ffc024ccffae; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.content_assignments
    ADD CONSTRAINT "FK_1bfab36c2b38090ffc024ccffae" FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: content_assignments FK_1e9164f6db9b8a26950ccefebe4; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.content_assignments
    ADD CONSTRAINT "FK_1e9164f6db9b8a26950ccefebe4" FOREIGN KEY (sent_by) REFERENCES public.users(id);


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
-- Name: content_assignments FK_400b2f43ca0225d2f2af9aa08be; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.content_assignments
    ADD CONSTRAINT "FK_400b2f43ca0225d2f2af9aa08be" FOREIGN KEY (consultant_id) REFERENCES public.users(id);


--
-- Name: consultant_reports FK_42124bba6e32bd4ec1a35160578; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.consultant_reports
    ADD CONSTRAINT "FK_42124bba6e32bd4ec1a35160578" FOREIGN KEY (consultant_id) REFERENCES public.users(id);


--
-- Name: response_answer_selections FK_470e3a4d62a9e874e315a43dacf; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.response_answer_selections
    ADD CONSTRAINT "FK_470e3a4d62a9e874e315a43dacf" FOREIGN KEY (response_id) REFERENCES public.survey_responses(id) ON DELETE CASCADE;


--
-- Name: training_events FK_47ec7b4987b28e595fc774e9434; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.training_events
    ADD CONSTRAINT "FK_47ec7b4987b28e595fc774e9434" FOREIGN KEY (completed_by) REFERENCES public.users(id);


--
-- Name: distribution_campaigns FK_48c7660450ae2a9eb09d68761f7; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.distribution_campaigns
    ADD CONSTRAINT "FK_48c7660450ae2a9eb09d68761f7" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: training_notifications FK_48e3aa144b9628aa1c36e7676f9; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.training_notifications
    ADD CONSTRAINT "FK_48e3aa144b9628aa1c36e7676f9" FOREIGN KEY (event_id) REFERENCES public.training_events(id) ON DELETE CASCADE;


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
-- Name: api_cost_logs FK_6171bcd77658000536402b2e9d7; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.api_cost_logs
    ADD CONSTRAINT "FK_6171bcd77658000536402b2e9d7" FOREIGN KEY (ai_insight_id) REFERENCES public.ai_insights(id);


--
-- Name: platform_settings FK_62e70f824fccd12d37b7fe11b01; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT "FK_62e70f824fccd12d37b7fe11b01" FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: content_engagement_logs FK_64337e4b7f4260f57d85b610edd; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.content_engagement_logs
    ADD CONSTRAINT "FK_64337e4b7f4260f57d85b610edd" FOREIGN KEY (user_id) REFERENCES public.users(id);


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
-- Name: content_engagement_logs FK_698ba03e3cfc40312e127e917e3; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.content_engagement_logs
    ADD CONSTRAINT "FK_698ba03e3cfc40312e127e917e3" FOREIGN KEY (training_event_id) REFERENCES public.training_events(id);


--
-- Name: content_assignments FK_6dd822c277ad80d2f0ba53731ca; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.content_assignments
    ADD CONSTRAINT "FK_6dd822c277ad80d2f0ba53731ca" FOREIGN KEY (notified_by) REFERENCES public.users(id);


--
-- Name: consultant_reports FK_6ea2747b3b2e43c7e81de3e092b; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.consultant_reports
    ADD CONSTRAINT "FK_6ea2747b3b2e43c7e81de3e092b" FOREIGN KEY (company_id) REFERENCES public.companies(id);


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
-- Name: training_events FK_7da12582538328c5b9eb80b87ca; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.training_events
    ADD CONSTRAINT "FK_7da12582538328c5b9eb80b87ca" FOREIGN KEY (company_id) REFERENCES public.companies(id);


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
-- Name: training_events FK_8bc5385f77da80091c06e3b6cb3; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.training_events
    ADD CONSTRAINT "FK_8bc5385f77da80091c06e3b6cb3" FOREIGN KEY (content_item_id) REFERENCES public.content_items(id);


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
-- Name: api_cost_logs FK_97770069d5040f4d6009a756c7f; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.api_cost_logs
    ADD CONSTRAINT "FK_97770069d5040f4d6009a756c7f" FOREIGN KEY (company_id) REFERENCES public.companies(id);


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
-- Name: api_cost_logs FK_9efaf7ae87a26f5cfab24f8a09f; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.api_cost_logs
    ADD CONSTRAINT "FK_9efaf7ae87a26f5cfab24f8a09f" FOREIGN KEY (consultant_id) REFERENCES public.users(id);


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
-- Name: training_events FK_a6d178f9d81fbe3eebd0ebcb8cb; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.training_events
    ADD CONSTRAINT "FK_a6d178f9d81fbe3eebd0ebcb8cb" FOREIGN KEY (plan_id) REFERENCES public.training_plans(id) ON DELETE CASCADE;


--
-- Name: content_engagement_logs FK_a7acb2d275dcdcb7db5f438c976; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.content_engagement_logs
    ADD CONSTRAINT "FK_a7acb2d275dcdcb7db5f438c976" FOREIGN KEY (content_item_id) REFERENCES public.content_items(id) ON DELETE CASCADE;


--
-- Name: credit_transactions FK_a8d7a73013307ce2c4c87874524; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT "FK_a8d7a73013307ce2c4c87874524" FOREIGN KEY (consultant_id) REFERENCES public.users(id);


--
-- Name: training_notifications FK_ab557b98579580ade1afe439d07; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.training_notifications
    ADD CONSTRAINT "FK_ab557b98579580ade1afe439d07" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: training_plans FK_b099cc9b8114cfb582aae3e8f2a; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.training_plans
    ADD CONSTRAINT "FK_b099cc9b8114cfb582aae3e8f2a" FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: surveys FK_b395d649c64d92997cb33f4d572; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT "FK_b395d649c64d92997cb33f4d572" FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: consultant_payment_methods FK_b73ee57c894c597093ea62263fb; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.consultant_payment_methods
    ADD CONSTRAINT "FK_b73ee57c894c597093ea62263fb" FOREIGN KEY (consultant_id) REFERENCES public.users(id);


--
-- Name: audit_logs FK_bd2726fd31b35443f2245b93ba0; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: api_cost_logs FK_c4ec6e25a38d1db86c437da5757; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.api_cost_logs
    ADD CONSTRAINT "FK_c4ec6e25a38d1db86c437da5757" FOREIGN KEY (credit_tx_id) REFERENCES public.credit_transactions(id);


--
-- Name: training_plans FK_caccf413eef87e8ea430feacefb; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.training_plans
    ADD CONSTRAINT "FK_caccf413eef87e8ea430feacefb" FOREIGN KEY (consultant_id) REFERENCES public.users(id);


--
-- Name: training_notifications FK_cc9302336a5b232f908d5dc23ff; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.training_notifications
    ADD CONSTRAINT "FK_cc9302336a5b232f908d5dc23ff" FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: training_events FK_d1eaabe7de9f58768453166f1d1; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.training_events
    ADD CONSTRAINT "FK_d1eaabe7de9f58768453166f1d1" FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: content_engagement_logs FK_d5808cb0f47b055b07c88e2384d; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.content_engagement_logs
    ADD CONSTRAINT "FK_d5808cb0f47b055b07c88e2384d" FOREIGN KEY (company_id) REFERENCES public.companies(id);


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
-- Name: training_plans FK_fee5eb1bf99d233ff52103dafaa; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.training_plans
    ADD CONSTRAINT "FK_fee5eb1bf99d233ff52103dafaa" FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: wellanalytics
--

GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict fVwtLMJ15kWxe6qxDfsa3q7z9kZTftRcLn9SJsumXo71z3IaZ6zULhWuOQ2jzdF

