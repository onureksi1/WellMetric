--
-- PostgreSQL database dump
--

\restrict PIJYZcrBWZSlED0AyLmhNknc6KGShm01SR5ONRZUQgG0gayGzulRhD3haIWw97X

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
    total_tokens integer GENERATED ALWAYS AS ((input_tokens + output_tokens)) STORED NOT NULL,
    cost_try numeric(12,4) DEFAULT 0 NOT NULL,
    credit_amount integer DEFAULT 0 NOT NULL,
    usd_try_rate numeric(8,4) DEFAULT 0 NOT NULL
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
-- Name: in_app_notifications; Type: TABLE; Schema: public; Owner: wellanalytics
--

CREATE TABLE public.in_app_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    type character varying NOT NULL,
    title_tr character varying NOT NULL,
    title_en character varying NOT NULL,
    body_tr character varying,
    body_en character varying,
    link character varying,
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.in_app_notifications OWNER TO wellanalytics;

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
    platform_name character varying(200) DEFAULT 'Wellbeing Metric'::character varying NOT NULL,
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
    platform_logo_url text,
    payment_settings jsonb DEFAULT '{}'::jsonb NOT NULL
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
\.


--
-- Data for Name: api_cost_logs; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.api_cost_logs (id, consultant_id, company_id, task_type, provider, model, input_tokens, output_tokens, cost_usd, revenue_try, ai_insight_id, credit_tx_id, duration_ms, created_at, cost_try, credit_amount, usd_try_rate) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.audit_logs (id, user_id, company_id, action, target_type, target_id, payload, ip_address, created_at) FROM stdin;
68f04282-c1a4-4c45-b4f5-dc4fcbd0d949	6c8d7930-a701-43a7-bef0-2dac62edd1e0	\N	settings.api_keys.update	platform_settings	\N	\N	\N	2026-05-07 12:11:44.564973+03
c2829454-d99b-4bd6-ac20-d14c8109d5da	6c8d7930-a701-43a7-bef0-2dac62edd1e0	\N	settings.ai_models.update	platform_settings	\N	\N	\N	2026-05-07 12:11:47.476113+03
07f80db5-d2b3-47b6-b802-977b1e1e9deb	6c8d7930-a701-43a7-bef0-2dac62edd1e0	\N	settings.update	platform_settings	\N	\N	\N	2026-05-07 12:13:30.677651+03
1687e35d-7839-4a64-a769-aee46aeadd2a	\N	\N	settings.logo.update	platform_settings	\N	{"s3_key": "platform/logo/758d542d-63ff-448a-9374-e07135701df0.png", "logo_url": "http://localhost:3001/api/v1/uploads/local-mock?key=platform%2Flogo%2F758d542d-63ff-448a-9374-e07135701df0.png"}	\N	2026-05-07 12:44:49.941615+03
9e9e585e-4f36-4b79-a84b-148edc193e4f	6c8d7930-a701-43a7-bef0-2dac62edd1e0	\N	settings.update	platform_settings	\N	\N	\N	2026-05-07 12:48:04.603962+03
bac5e7a5-1d82-40f4-bf49-14a0ce2b2b1d	6c8d7930-a701-43a7-bef0-2dac62edd1e0	\N	settings.update	platform_settings	\N	\N	\N	2026-05-07 12:48:21.365266+03
0a91d3a4-dd1c-4d6a-b758-efa464706a24	6c8d7930-a701-43a7-bef0-2dac62edd1e0	\N	settings.payment.update	platform_settings	\N	{"updated_providers": []}	\N	2026-05-07 12:52:11.323324+03
6b437d70-429f-4091-a25d-4ae88de1c2ce	6c8d7930-a701-43a7-bef0-2dac62edd1e0	\N	settings.payment.toggle	platform_settings	\N	{"provider": "paytr", "is_active": false}	\N	2026-05-07 12:52:20.17584+03
7173c24e-1ca9-4b61-a779-d1e8a5f6281e	6c8d7930-a701-43a7-bef0-2dac62edd1e0	\N	settings.payment.toggle	platform_settings	\N	{"provider": "paytr", "is_active": true}	\N	2026-05-07 12:52:20.956424+03
2189f6ca-8ba2-4f2a-afcb-f09b86da0225	6c8d7930-a701-43a7-bef0-2dac62edd1e0	\N	settings.payment.toggle	platform_settings	\N	{"provider": "paytr", "is_active": false}	\N	2026-05-07 12:52:46.687134+03
444db582-00fd-436b-844b-e8018577bff4	6c8d7930-a701-43a7-bef0-2dac62edd1e0	\N	settings.payment.toggle	platform_settings	\N	{"provider": "stripe", "is_active": false}	\N	2026-05-07 12:52:48.009493+03
ba73ba48-dcf2-4255-a188-594ba82107b7	6c8d7930-a701-43a7-bef0-2dac62edd1e0	\N	settings.payment.toggle	platform_settings	\N	{"provider": "stripe", "is_active": true}	\N	2026-05-07 12:52:50.593037+03
18fb8098-adf3-4b00-b603-c89ef145b7f1	f1240e2a-b82f-41d4-8920-0c3bdfc51e3c	3f869eef-7933-44a1-93c3-9b0489c4166a	company.create	company	3f869eef-7933-44a1-93c3-9b0489c4166a	{"name": "Onur TECH", "plan": "starter"}	\N	2026-05-07 13:02:51.126002+03
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.companies (id, name, slug, industry, size_band, plan, plan_expires_at, is_active, contact_email, logo_url, settings, created_at, created_by, consultant_id) FROM stdin;
3f869eef-7933-44a1-93c3-9b0489c4166a	Onur TECH	onur-tech	technology	1-50	starter	\N	t	onur@3bitz.com	\N	{"default_language": "tr", "benchmark_visible": true, "employee_accounts": false, "anonymity_threshold": 5}	2026-05-07 13:02:51.109124+03	f1240e2a-b82f-41d4-8920-0c3bdfc51e3c	f1240e2a-b82f-41d4-8920-0c3bdfc51e3c
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
1464eae9-db4e-48aa-832a-614a709039c7	f1240e2a-b82f-41d4-8920-0c3bdfc51e3c	starter	3	100	t	f	\N	\N	t	2026-05-07 12:54:12.608828+03	\N	\N	\N	\N	f
\.


--
-- Data for Name: consultant_reports; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.consultant_reports (id, consultant_id, company_id, title, summary, content, period, ai_insight_ids, status, published_at, notified_at, tags, is_pinned, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: content_assignments; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.content_assignments (id, content_item_id, consultant_id, company_id, department_id, status, sent_at, sent_by, notes, created_at, updated_at, notified_at, notified_by) FROM stdin;
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
\.


--
-- Data for Name: credit_balances; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.credit_balances (id, consultant_id, credit_type_key, balance, used_this_month, last_reset_at, updated_at) FROM stdin;
ddf58f83-78e4-4a18-99c5-9dcc1c2ccda6	f1240e2a-b82f-41d4-8920-0c3bdfc51e3c	ai_credit	500	0	2026-05-07 12:54:13.062	2026-05-07 12:54:12.608828
a7db8adc-168c-4087-8b8a-092d60b79609	f1240e2a-b82f-41d4-8920-0c3bdfc51e3c	mail_credit	1998	2	2026-05-07 12:54:13.062	2026-05-07 17:02:03.577007
\.


--
-- Data for Name: credit_transactions; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.credit_transactions (id, consultant_id, credit_type_key, amount, type, description, company_id, reference_id, created_at) FROM stdin;
bf54875f-35f4-48d2-adef-78310c638b0e	f1240e2a-b82f-41d4-8920-0c3bdfc51e3c	ai_credit	500	reset	Starter — ilk aktivasyon	\N	\N	2026-05-07 12:54:12.608828
04d520a5-0eba-4a08-95e9-c5634c48ad24	f1240e2a-b82f-41d4-8920-0c3bdfc51e3c	mail_credit	2000	reset	Starter — ilk aktivasyon	\N	\N	2026-05-07 12:54:12.608828
f9f1282b-8692-4d7a-853c-0ec4bf065864	f1240e2a-b82f-41d4-8920-0c3bdfc51e3c	mail_credit	-1	usage	E-posta Gönderimi: welcome_hr	3f869eef-7933-44a1-93c3-9b0489c4166a	\N	2026-05-07 13:02:51.809122
d6f03a6c-dda4-4f2b-b609-f2bd45e73ebf	f1240e2a-b82f-41d4-8920-0c3bdfc51e3c	mail_credit	-1	usage	E-posta Gönderimi: survey_assigned	3f869eef-7933-44a1-93c3-9b0489c4166a	\N	2026-05-07 17:02:03.577007
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
6320bc11-5165-4ba8-ae44-5e746a4f9791	3f869eef-7933-44a1-93c3-9b0489c4166a	Software	t	2026-05-07 15:15:21.316973+03
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
f7267e65-01f9-4004-ba44-76d23a91ced1	3f869eef-7933-44a1-93c3-9b0489c4166a	6320bc11-5165-4ba8-ae44-5e746a4f9791	Onur Ekşi	onuroctoplus@gmail.com	Developer	2024-01-01	t	2026-05-07 15:15:21.329033	2026-05-07 15:15:21.329033	\N
c55267b7-1f8c-4295-b348-59f289242179	3f869eef-7933-44a1-93c3-9b0489c4166a	6320bc11-5165-4ba8-ae44-5e746a4f9791	Filiz Babacan	filizerba@gmail.com	Developer	2024-01-01	t	2026-05-07 15:15:21.346196	2026-05-07 15:15:21.346196	\N
031658f8-869d-4503-9cd9-d18e9a33974f	3f869eef-7933-44a1-93c3-9b0489c4166a	6320bc11-5165-4ba8-ae44-5e746a4f9791	Can Karaman	10ureksi@gmail.com	Müdür	2024-01-01	t	2026-05-07 15:15:21.350729	2026-05-07 15:15:21.350729	\N
1841ef05-ad2e-4315-9c61-2c506e4ebcec	3f869eef-7933-44a1-93c3-9b0489c4166a	6320bc11-5165-4ba8-ae44-5e746a4f9791	Tarık Tarcan	onureksi@outlook.com	M.Yardımcısı	2024-01-01	t	2026-05-07 15:15:21.354322	2026-05-07 15:15:21.354322	\N
7c6938b9-b4fd-4f6b-8cac-fdd86bd37db8	3f869eef-7933-44a1-93c3-9b0489c4166a	6320bc11-5165-4ba8-ae44-5e746a4f9791	Ari Kohen	paccikontrol@gmail.com	M.Yardımcısı	2024-01-01	t	2026-05-07 15:15:21.357586	2026-05-07 15:15:21.357586	\N
db0987c1-00a3-44d4-b5ae-61ba6dab5fb1	3f869eef-7933-44a1-93c3-9b0489c4166a	6320bc11-5165-4ba8-ae44-5e746a4f9791	Emre Cemali	emrecemali16@gmail.com	Müdür	2024-01-01	t	2026-05-07 15:15:21.360152	2026-05-07 15:15:21.360152	\N
\.


--
-- Data for Name: in_app_notifications; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.in_app_notifications (id, user_id, is_read, metadata, type, title_tr, title_en, body_tr, body_en, link, read_at, created_at) FROM stdin;
0d06f760-7fd6-46f7-a53e-c9fff8cc55d7	60c3ef2d-d4dc-436e-a45d-04ce8a96eb96	t	{}	info	Sisteme Hoş Geldiniz!	Welcome to the System!	Bildirim merkeziniz artık aktif. Buradan önemli güncellemeleri takip edebilirsiniz.	Your notification center is now active. You can follow important updates here.	/dashboard	2026-05-07 17:57:21.073	2026-05-07 17:56:02.922329
cfea8423-58d9-4358-8b4c-c186179c2a7f	60c3ef2d-d4dc-436e-a45d-04ce8a96eb96	t	{}	alert	Düşük Kredi Uyarısı	Low Credit Alert	Krediniz %20'nin altına düşmüştür. Lütfen yükleme yapınız.	Your credit has fallen below 20%. Please top up.	/dashboard	2026-05-07 17:57:28.827	2026-05-07 16:56:02.922329
6c73e95c-8e7d-4ab9-b607-677976e7f5fe	60c3ef2d-d4dc-436e-a45d-04ce8a96eb96	t	{}	success	Rapor Hazır	Report Ready	Yazılım departmanı analiz raporu başarıyla oluşturuldu.	Software department analysis report has been generated successfully.	/dashboard/reports	2026-05-07 17:57:31.393	2026-05-07 15:56:02.922329
f88a56ab-cb97-424a-b0e8-7a71dda72608	60c3ef2d-d4dc-436e-a45d-04ce8a96eb96	t	{}	system_test	Hoş Geldiniz!	Welcome!	Bildirim sistemimiz başarıyla kuruldu.	Notification system is successfully installed.	/dashboard	2026-05-07 18:02:31.93	2026-05-07 17:33:03.592659
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
64daf6bf-6c78-4f2c-b0ff-2f0ab7a2648d	f1240e2a-b82f-41d4-8920-0c3bdfc51e3c	\N	48f7892428697eccb30c83525aa6b0f2223bd4035bca53132d1d859523c4eeb8b8a3803b597a004f253e87f74e444d0c1b641c921ba7b4cddab8eef86cd1952d	consultant_invite	2026-05-09 12:54:13.083+03	2026-05-07 12:55:04.789+03	2026-05-07 12:54:12.608828+03
cdc90f52-0210-417e-87ac-7ebddeedb2af	60c3ef2d-d4dc-436e-a45d-04ce8a96eb96	3f869eef-7933-44a1-93c3-9b0489c4166a	06a22549263445d9fc1e02289161b4d5d284fb0774092c54016e42fe8ee09b1fd5de8839cc9aa79953a28123fda5be017a213bed3770fc1acbf94831b136d1f5	hr_invite	2026-05-08 13:02:51.122+03	2026-05-07 13:49:14.718+03	2026-05-07 13:02:51.109124+03
\.


--
-- Data for Name: mail_templates; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.mail_templates (id, slug, subject_tr, subject_en, body_tr, body_en, variables, description, is_active, updated_at, updated_by) FROM stdin;
e494e29e-df3a-43e8-9c58-984133570140	consultant_invite	Eğitmen / Danışman Hesabınızı Oluşturun	Create Your Consultant Account	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><img src="{{brand_logo_url}}" alt="{{brand_name}}" style="max-height: 48px; border:0; display:block; margin: 0 auto;"></div><div class="content"><h2>Hoş Geldiniz, {{full_name}}!</h2><p>Wellbeing platformu üzerinde Eğitmen / Danışman hesabınız tanımlandı. Aşağıdaki butona tıklayarak kaydınızı tamamlayabilir ve şifrenizi belirleyebilirsiniz.</p><p>Bu davet bağlantısı {{expires_in}} boyunca geçerlidir.</p><div class="cta-container"><a href="{{invite_link}}" class="cta-button">Hesabımı Oluştur →</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>	<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #ffffff; padding: 32px; border-bottom: 1px solid #f1f5f9; text-align: center; } .header h1 { color: #2E865A; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; }</style></head><body><div class="wrapper"><div class="header"><img src="{{brand_logo_url}}" alt="{{brand_name}}" style="max-height: 48px; border:0; display:block; margin: 0 auto;"></div><div class="content"><h2>Welcome, {{full_name}}!</h2><p>Your Consultant account has been defined on the Wellbeing platform. Click the button below to complete your registration and set your password.</p><p>This invitation link is valid for {{expires_in}}.</p><div class="cta-container"><a href="{{invite_link}}" class="cta-button">Create My Account →</a></div></div><div class="footer"><p><b>Wellbeing Metric</b></p><p>For questions, contact us at <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a>.</p></div></div></body></html>	["{{full_name}}", "{{invite_link}}", "{{expires_in}}"]	Eğitmen / Danışman davet mesajı	t	2026-05-05 13:18:02.956987+03	\N
3810a446-236f-4dd5-bfab-6897c384038c	campaign_bounced	⚠️ Teslim Edilemeyen Mailler	⚠️ Undelivered Emails	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #E67E22; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #E67E22; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert-box { background: #FEF9E7; border: 1px solid #F1C40F; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Merhaba {{hr_name}},</h2>\n      <p><b>{{company_name}}</b> için başlattığınız kampanyada bazı e-postaların alıcılara ulaşmadığını tespit ettik.</p>\n      \n      <div class="alert-box">\n        <p style="margin: 0; color: #D68910; font-weight: bold; font-size: 24px;">{{bounced_count}}</p>\n        <p style="margin: 5px 0 0 0; color: #9C640C; font-size: 14px;">Teslim Edilemeyen E-posta</p>\n      </div>\n\n      <p>Hatalı e-posta adreslerini kontrol etmek ve katılım oranını artırmak için kampanya detaylarını inceleyebilirsiniz:</p>\n\n      <div style="text-align: center;">\n        <a href="{{dashboard_link}}" class="btn">Kampanya Detayına Git →</a>\n      </div>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #E67E22; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #E67E22; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert-box { background: #FEF9E7; border: 1px solid #F1C40F; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Hello {{hr_name}},</h2>\n      <p>We've detected that some emails in your campaign for <b>{{company_name}}</b> have not reached the recipients.</p>\n      \n      <div class="alert-box">\n        <p style="margin: 0; color: #D68910; font-weight: bold; font-size: 24px;">{{bounced_count}}</p>\n        <p style="margin: 5px 0 0 0; color: #9C640C; font-size: 14px;">Bounced Emails</p>\n      </div>\n\n      <p>You can review the campaign details to check incorrect email addresses and improve participation rates:</p>\n\n      <div style="text-align: center;">\n        <a href="{{dashboard_link}}" class="btn">View Campaign Details →</a>\n      </div>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{hr_name}}", "{{company_name}}", "{{bounced_count}}", "{{dashboard_link}}"]	\N	t	2026-05-07 13:46:34.015348+03	\N
c528d3bb-4cd9-40a2-9cb4-109208c1877b	password_reset	Şifre Sıfırlama Talebi	Password Reset Request	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #f8fafc; border-left: 4px solid #cbd5e1; padding: 12px; margin: 16px 0; font-size: 13px; color: #64748b; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Merhaba {{user_name}},</h2>\n      <p>Hesabınız için bir şifre sıfırlama talebinde bulundunuz. Yeni şifrenizi belirlemek için aşağıdaki butona tıklayabilirsiniz:</p>\n      <div style="text-align: center;">\n        <a href="{{reset_link}}" class="btn">Şifremi Sıfırla →</a>\n      </div>\n      <p>Bu bağlantı <b>{{expires_in}}</b> (1 saat) süresince geçerlidir.</p>\n      <div class="alert">\n        <p>Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı görmezden gelin. Hesabınız güvendedir.</p>\n      </div>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #f8fafc; border-left: 4px solid #cbd5e1; padding: 12px; margin: 16px 0; font-size: 13px; color: #64748b; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Hello {{user_name}},</h2>\n      <p>You have requested to reset your password. You can set a new password by clicking the button below:</p>\n      <div style="text-align: center;">\n        <a href="{{reset_link}}" class="btn">Reset My Password →</a>\n      </div>\n      <p>This link is valid for <b>{{expires_in}}</b> (1 hour).</p>\n      <div class="alert">\n        <p>If you did not request this, please ignore this email. Your account is safe.</p>\n      </div>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{user_name}}", "{{reset_link}}", "{{expires_in}}"]	Şifre sıfırlama linki	t	2026-05-07 13:46:34.027591+03	\N
db310e03-aa5b-4370-a656-acc1957a7632	campaign_reminder	⏰ Hatırlatma: Anketinizi Tamamlayın	⏰ Reminder: Complete Your Survey	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #FFF3CD; border-left: 4px solid #E07B1A; padding: 16px; margin: 24px 0; text-align: center; border-radius: 8px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Merhaba {{full_name}},</h2>\n      <p><b>{{company_name}}</b> için düzenlenen <b>{{survey_title}}</b> anketini henüz tamamlamadığınızı fark ettik. Görüşlerinizi paylaşmanız bizim için çok önemli.</p>\n      \n      <div class="alert">\n        <p style="margin: 0; font-weight: bold; color: #856404;">⏰ Kalan Süre: {{days_remaining}} Gün</p>\n      </div>\n\n      <p>Anketi tamamlamak sadece birkaç dakikanızı alacaktır. Kaldığınız yerden devam edebilir veya baştan başlayabilirsiniz:</p>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Anketi Tamamla →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"Cevaplarınızın tamamen anonim olduğunu ve esenlik stratejimizi şekillendirdiğini hatırlatmak isteriz."</p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #FFF3CD; border-left: 4px solid #E07B1A; padding: 16px; margin: 24px 0; text-align: center; border-radius: 8px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Hello {{full_name}},</h2>\n      <p>We noticed you haven't yet completed the <b>{{survey_title}}</b> survey for <b>{{company_name}}</b>. Sharing your views is very important to us.</p>\n      \n      <div class="alert">\n        <p style="margin: 0; font-weight: bold; color: #856404;">⏰ Time Left: {{days_remaining}} Days</p>\n      </div>\n\n      <p>Completing the survey only takes a few minutes. You can continue where you left off or start fresh:</p>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Complete Survey →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"We remind you that your answers are completely anonymous and shape our wellbeing strategy."</p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{full_name}}", "{{company_name}}", "{{survey_title}}", "{{survey_link}}", "{{days_remaining}}"]	\N	t	2026-05-07 13:46:34.019258+03	\N
c7aacac8-b474-4d71-8a92-ada0ddf2b719	draft_reminder	📝 Yarım Kalan Anketiniz Sizi Bekliyor	📝 Your Incomplete Survey is Waiting	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Merhaba {{full_name}},</h2>\n      <p><b>{{survey_title}}</b> anketini yarıda bıraktığınızı fark ettik. Cevaplarınızın kaydedildiğini ve dilediğiniz zaman kaldığınız yerden devam edebileceğinizi hatırlatmak isteriz.</p>\n      \n      <p>Anketi tamamlamak için son tarih: <b>{{due_date}}</b></p>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Kaldığım Yerden Devam Et →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"Sadece birkaç dakika ayırarak esenlik yolculuğunuza katkıda bulunabilirsiniz."</p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Hello {{full_name}},</h2>\n      <p>We noticed you haven't yet completed the <b>{{survey_title}}</b> survey. We want to remind you that your progress has been saved, and you can continue whenever you like.</p>\n      \n      <p>The deadline to complete the survey is: <b>{{due_date}}</b></p>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Continue Where I Left Off →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"Taking just a few minutes of your time contributes greatly to your company's wellbeing journey."</p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{full_name}}", "{{survey_title}}", "{{survey_link}}", "{{due_date}}"]	\N	t	2026-05-07 13:46:34.024409+03	\N
e1fc6aa6-d1b3-4e82-81ea-1b77838d96a1	plan_expiry	⚠️ Aboneliğiniz Sona Ermek Üzere	⚠️ Your Subscription is About to Expire	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #E67E22; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .warning-box { background: #FEF9E7; border-left: 4px solid #F1C40F; padding: 16px; margin: 24px 0; border-radius: 8px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Merhaba,</h2>\n      <p><b>{{company_name}}</b> firmasına ait <b>{{plan_name}}</b> aboneliğinizin sona ermesine az bir süre kaldı.</p>\n      \n      <div class="warning-box">\n        <p style="margin: 0; font-weight: bold; color: #9C640C;">Aboneliğiniz {{days_remaining}} gün içinde sona erecektir.</p>\n      </div>\n\n      <p>Hizmet kesintisi yaşamamak ve esenlik verilerinize erişimin devam etmesi için aboneliğinizi yenilemenizi öneririz.</p>\n      <p>Yenileme işlemleri ve paket seçenekleri için bizimle <b>{{contact_email}}</b> adresinden iletişime geçebilirsiniz.</p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #E67E22; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .warning-box { background: #FEF9E7; border-left: 4px solid #F1C40F; padding: 16px; margin: 24px 0; border-radius: 8px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Hello,</h2>\n      <p>Your <b>{{plan_name}}</b> subscription for <b>{{company_name}}</b> is about to expire soon.</p>\n      \n      <div class="warning-box">\n        <p style="margin: 0; font-weight: bold; color: #9C640C;">Your subscription will end in {{days_remaining}} days.</p>\n      </div>\n\n      <p>To avoid service disruption and maintain access to your wellbeing data, we recommend renewing your subscription.</p>\n      <p>You can contact us at <b>{{contact_email}}</b> for renewal processes and plan options.</p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{company_name}}", "{{days_remaining}}", "{{plan_name}}"]	\N	t	2026-05-07 13:46:34.028811+03	\N
5f2b0748-783a-4600-8d94-edc638d497c5	employee_invite	Wellbeing Hesabınızı Oluşturun	Create Your Wellbeing Account	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Merhaba {{full_name}},</h2>\n      <p><b>{{company_name}}</b> sizi Wellbeing Metricna davet etti! Bu platform üzerinden esenlik yolculuğunuza başlayabilir, anketlere katılabilir ve size özel önerilere ulaşabilirsiniz.</p>\n      <p>Hesabınızı oluşturmak ve platforma katılmak için aşağıdaki butona tıklayın:</p>\n      <div style="text-align: center;">\n        <a href="{{invite_link}}" class="btn">Hesabımı Oluştur →</a>\n      </div>\n      <p>Bu davet bağlantısı <b>{{expires_in}}</b> (72 saat) süresince geçerlidir.</p>\n      <p>Sizi aramızda görmekten mutluluk duyacağız.</p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Hello {{full_name}},</h2>\n      <p><b>{{company_name}}</b> has invited you to join the Wellbeing Platform! Start your wellbeing journey, participate in surveys, and get personalized recommendations.</p>\n      <p>To create your account and join the platform, click the button below:</p>\n      <div style="text-align: center;">\n        <a href="{{invite_link}}" class="btn">Create My Account →</a>\n      </div>\n      <p>This invitation link is valid for <b>{{expires_in}}</b> (72 hours).</p>\n      <p>We look forward to seeing you on board.</p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{full_name}}", "{{company_name}}", "{{invite_link}}", "{{expires_in}}"]	Çalışan kayıt davetiyesi	t	2026-05-07 13:46:34.026814+03	\N
becd103c-f239-4141-baa1-ae0ddbe3584d	survey_reminder	⏰ Anketinizi Tamamlamayı Unutmayın	⏰ Don't Forget to Complete Your Survey	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #FFF3CD; border-left: 4px solid #E07B1A; padding: 16px; margin: 24px 0; text-align: center; border-radius: 8px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Merhaba {{full_name}},</h2>\n      <p><b>{{survey_title}}</b> anketinizi henüz tamamlamadığınızı hatırlatmak istedik. Sizin fikirleriniz platformun başarısı ve doğru analizler için kritik önem taşıyor.</p>\n      \n      <div class="alert">\n        <p style="margin: 0; font-weight: bold; color: #856404;">⏰ Son {{days_remaining}} Gün!</p>\n      </div>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Ankete Başla →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"Tamamladığınız anketler şirketinizin wellbeing skorunu doğru yansıtacaktır."</p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; color: white !important; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #FFF3CD; border-left: 4px solid #E07B1A; padding: 16px; margin: 24px 0; text-align: center; border-radius: 8px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Hello {{full_name}},</h2>\n      <p>We wanted to remind you that you haven't yet completed the <b>{{survey_title}}</b> survey. Your ideas are critical for the platform's success and accurate analysis.</p>\n      \n      <div class="alert">\n        <p style="margin: 0; font-weight: bold; color: #856404;">⏰ Only {{days_remaining}} Days Left!</p>\n      </div>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Start Survey →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"Completed surveys will accurately reflect your company's wellbeing score."</p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{full_name}}", "{{survey_title}}", "{{survey_link}}", "{{days_remaining}}"]	\N	t	2026-05-07 13:46:34.036633+03	\N
722695ab-7aa6-494c-ad4b-72011ee7546a	survey_token_invite	🌱 Wellbeing Anketiniz Hazır	🌱 Your Wellbeing Survey is Ready	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .metric-container { display: flex; justify-content: space-between; gap: 10px; margin: 24px 0; }\n    .metric-box { flex: 1; background: #f0fdf4; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #dcfce7; }\n    .metric-box span { display: block; font-size: 10px; color: #888; font-weight: bold; text-transform: uppercase; }\n    .metric-box b { font-size: 14px; color: #2E865A; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Merhaba {{full_name}},</h2>\n      <p><b>{{company_name}}</b> adına bu dönem wellbeing anketini doldurmanızı rica ediyoruz. Cevaplarınız, şirketinizdeki çalışma ortamını ve esenliği iyileştirmemize yardımcı olacaktır.</p>\n      \n      <div class="metric-container">\n        <div class="metric-box">\n          <span>Süre</span>\n          <b>~{{estimated_minutes}} Dakika</b>\n        </div>\n        <div class="metric-box">\n          <span>Güvenlik</span>\n          <b>%100 Anonim</b>\n        </div>\n        <div class="metric-box">\n          <span>Son Tarih</span>\n          <b>{{due_date}}</b>\n        </div>\n      </div>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Ankete Başla →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"Verileriniz tamamen anonim tutulur ve kişisel cevaplarınız yöneticilerle paylaşılmaz."</p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .metric-container { display: flex; justify-content: space-between; gap: 10px; margin: 24px 0; }\n    .metric-box { flex: 1; background: #f0fdf4; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #dcfce7; }\n    .metric-box span { display: block; font-size: 10px; color: #888; font-weight: bold; text-transform: uppercase; }\n    .metric-box b { font-size: 14px; color: #2E865A; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Hello {{full_name}},</h2>\n      <p>On behalf of <b>{{company_name}}</b>, we kindly ask you to complete this period's wellbeing survey. Your feedback helps us improve the work environment and wellbeing at your company.</p>\n      \n      <div class="metric-container">\n        <div class="metric-box">\n          <span>Time</span>\n          <b>~{{estimated_minutes}} Mins</b>\n        </div>\n        <div class="metric-box">\n          <span>Security</span>\n          <b>100% Anonymous</b>\n        </div>\n        <div class="metric-box">\n          <span>Deadline</span>\n          <b>{{due_date}}</b>\n        </div>\n      </div>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Start Survey →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"Your data is kept completely anonymous and your individual answers are not shared with managers."</p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{full_name}}", "{{company_name}}", "{{survey_title}}", "{{survey_link}}", "{{due_date}}"]	Bireysel anket davetiyesi	t	2026-05-07 13:46:34.037266+03	\N
51bcf085-6ef9-4020-8bc5-a35b6b3c3738	report_failed	❌ Rapor Oluşturulamadı	❌ Report Generation Failed	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #C0392B; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .error-box { background: #FFF0EE; border: 1px solid #FADBD8; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Merhaba {{hr_name}},</h2>\n      <p>Üzgünüz, <b>{{period}}</b> dönemine ait <b>{{format}}</b> raporunuz oluşturulurken teknik bir sorunla karşılaşıldı.</p>\n      \n      <div class="error-box">\n        <p style="margin: 0; color: #C0392B; font-weight: bold;">Rapor oluşturma işlemi başarısız oldu.</p>\n      </div>\n\n      <p>Lütfen dashboard üzerinden tekrar denemeyi deneyin. Sorun devam ederse bizimle <b>{{support_email}}</b> adresinden iletişime geçebilirsiniz.</p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #C0392B; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .error-box { background: #FFF0EE; border: 1px solid #FADBD8; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Hello {{hr_name}},</h2>\n      <p>We're sorry, but there was a technical issue while generating your <b>{{period}}</b> report in <b>{{format}}</b> format.</p>\n      \n      <div class="error-box">\n        <p style="margin: 0; color: #C0392B; font-weight: bold;">Report generation failed.</p>\n      </div>\n\n      <p>Please try again from the dashboard. If the problem persists, you can contact us at <b>{{support_email}}</b>.</p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{hr_name}}", "{{company_name}}", "{{period}}", "{{format}}", "{{support_email}}"]	\N	t	2026-05-07 13:46:34.029735+03	\N
f5daaa3d-2b89-4f67-be3b-c12065348497	training_plan_published	Wellbeing Platform Bildirimi	\N	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; border-bottom: 1px solid #eee; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #1D9E75; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0; }\n    .label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }\n    .value { font-size: 14px; font-weight: 600; color: #1e293b; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Yeni Eğitim Planı Yayınlandı!</h2>\n      <p>Danışmanınız <b>{{consultant_name}}</b>, kurumunuz için yeni bir eğitim/etkinlik planı yayınladı.</p>\n      \n      <div class="info-card">\n        <div class="label">Plan Başlığı</div>\n        <div class="value">{{plan_title}}</div>\n        \n        <div style="margin-top: 12px;">\n          <div class="label">Etkinlik Sayısı</div>\n          <div class="value">{{event_count}} adet etkinlik</div>\n        </div>\n\n        <div style="margin-top: 12px;">\n          <div class="label">Başlangıç Tarihi</div>\n          <div class="value">{{starts_at}}</div>\n        </div>\n      </div>\n\n      <p>Planlanan eğitimleri incelemek ve çalışanlarınıza duyurmak için aşağıdaki butona tıklayarak platforma giriş yapabilirsiniz:</p>\n      \n      <div style="text-align: center;">\n        <a href="{{plan_url}}" class="btn">Planı Görüntüle →</a>\n      </div>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	\N	[]	Danışman eğitim planı yayınladığında HR'a giden mail	t	2026-05-07 13:46:34.03792+03	\N
092d8ee2-c64a-4774-94df-80ed263701a3	ai_ready	🤖 AI Analizi Hazır	🤖 AI Analysis Ready	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: linear-gradient(135deg, #2E865A 0%, #6D28D9 100%); padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .ai-badge { display: inline-block; background: #EDE9FE; color: #6D28D9; padding: 4px 12px; border-radius: 99px; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 16px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <div class="ai-badge">Yapay Zeka İçgörüleri</div>\n      <h2>Merhaba {{hr_name}},</h2>\n      <p><b>{{company_name}}</b> için <b>{{period}}</b> dönemine ait veriler yapay zeka tarafından analiz edildi. Stratejik kararlarınıza yardımcı olacak derinlemesine içgörüler ve aksiyon önerileri hazır.</p>\n      \n      <p>AI analizi şunları içerir:</p>\n      <ul style="padding-left: 20px; color: #555;">\n        <li>Departman bazlı risk analizleri</li>\n        <li>Trend tahminleri</li>\n        <li>Kişiselleştirilmiş iyileştirme önerileri</li>\n      </ul>\n\n      <div style="text-align: center;">\n        <a href="{{dashboard_link}}" class="btn">Analizi Görüntüle →</a>\n      </div>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: linear-gradient(135deg, #2E865A 0%, #6D28D9 100%); padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .ai-badge { display: inline-block; background: #EDE9FE; color: #6D28D9; padding: 4px 12px; border-radius: 99px; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 16px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <div class="ai-badge">Artificial Intelligence Insights</div>\n      <h2>Hello {{hr_name}},</h2>\n      <p>The data for <b>{{company_name}}</b> for the <b>{{period}}</b> period has been analyzed by AI. In-depth insights and action suggestions to assist your strategic decisions are ready.</p>\n      \n      <p>The AI analysis includes:</p>\n      <ul style="padding-left: 20px; color: #555;">\n        <li>Department-based risk analysis</li>\n        <li>Trend predictions</li>\n        <li>Personalized improvement suggestions</li>\n      </ul>\n\n      <div style="text-align: center;">\n        <a href="{{dashboard_link}}" class="btn">View Analysis →</a>\n      </div>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{hr_name}}", "{{company_name}}", "{{period}}", "{{dashboard_link}}"]	\N	t	2026-05-07 13:46:34.011882+03	\N
7218fdfe-e8ea-4999-aee7-a2b52f7f58ca	campaign_invite	📋 Wellbeing Anketi Daveti	📋 Wellbeing Survey Invitation	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .metric-container { display: flex; justify-content: space-between; gap: 10px; margin: 24px 0; }\n    .metric-box { flex: 1; background: #f0fdf4; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #dcfce7; }\n    .metric-box span { display: block; font-size: 10px; color: #888; font-weight: bold; text-transform: uppercase; }\n    .metric-box b { font-size: 14px; color: #2E865A; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Merhaba {{full_name}},</h2>\n      <p><b>{{company_name}}</b> tarafından düzenlenen <b>{{survey_title}}</b> anketine davet edildiniz. Görüşleriniz platformumuzun gelişimi için çok değerlidir.</p>\n      \n      <div class="metric-container">\n        <div class="metric-box">\n          <span>Süre</span>\n          <b>~5 Dakika</b>\n        </div>\n        <div class="metric-box">\n          <span>Güvenlik</span>\n          <b>%100 Anonim</b>\n        </div>\n        <div class="metric-box">\n          <span>Son Tarih</span>\n          <b>{{due_date}}</b>\n        </div>\n      </div>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Ankete Başla →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"Bu anket özel bir kampanya kapsamında düzenlenmektedir ve sonuçlar sadece anonim olarak raporlanır."</p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .metric-container { display: flex; justify-content: space-between; gap: 10px; margin: 24px 0; }\n    .metric-box { flex: 1; background: #f0fdf4; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #dcfce7; }\n    .metric-box span { display: block; font-size: 10px; color: #888; font-weight: bold; text-transform: uppercase; }\n    .metric-box b { font-size: 14px; color: #2E865A; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Hello {{full_name}},</h2>\n      <p>You have been invited to participate in the <b>{{survey_title}}</b> survey organized by <b>{{company_name}}</b>. Your insights are very valuable for our platform's development.</p>\n      \n      <div class="metric-container">\n        <div class="metric-box">\n          <span>Time</span>\n          <b>~5 Mins</b>\n        </div>\n        <div class="metric-box">\n          <span>Security</span>\n          <b>100% Anonymous</b>\n        </div>\n        <div class="metric-box">\n          <span>Deadline</span>\n          <b>{{due_date}}</b>\n        </div>\n      </div>\n\n      <div style="text-align: center;">\n        <a href="{{survey_link}}" class="btn">Start Survey →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #666; font-style: italic; text-align: center;">"This survey is part of a special campaign, and results are reported anonymously."</p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{full_name}}", "{{company_name}}", "{{survey_title}}", "{{survey_link}}", "{{due_date}}"]	\N	t	2026-05-07 13:46:34.018214+03	\N
f1263a6a-468b-4505-a777-daf5d7eda85e	content_shared_to_employees	Wellbeing Platform Bildirimi	\N	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; border-bottom: 1px solid #eee; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #1D9E75; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0; }\n    .label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }\n    .value { font-size: 15px; font-weight: 600; color: #1e293b; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Sizin İçin Yeni Bir Kaynak Var!</h2>\n      <p>Merhaba <b>{{employee_name}}</b>,</p>\n      <p>Kurumunuz <b>{{company_name}}</b> ve danışmanınız <b>{{consultant_name}}</b>, esenliğinizi desteklemek için yeni bir içerik paylaştı.</p>\n      \n      <div class="info-card">\n        <div class="label">İçerik</div>\n        <div class="value">{{content_title}}</div>\n        \n        {{#if notes}}\n        <div style="margin-top: 12px;">\n          <div class="label">Not</div>\n          <div style="font-style: italic; color: #475569;">"{{notes}}"</div>\n        </div>\n        {{/if}}\n      </div>\n\n      <p>Bu kaynağa ulaşmak ve kendinize zaman ayırmak için aşağıdaki butona tıklayabilirsiniz:</p>\n      \n      <div style="text-align: center;">\n        <a href="{{content_url}}" class="btn">İçeriği Hemen Görüntüle →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #64748b;">Sağlıklı ve huzurlu bir gün dileriz.</p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	\N	[]	HR içeriği çalışanlara duyurduğunda giden mail	t	2026-05-07 13:46:34.023471+03	\N
76b2240a-1891-48e6-9b0c-d98a87b71090	consultant_report_ready	Wellbeing Platform Bildirimi	\N	<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="utf-8">\n    <style>\n        body { font-family: 'Inter', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; }\n        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }\n        .header { margin-bottom: 32px; }\n        .logo { font-size: 24px; fontWeight: 800; color: #2563eb; text-decoration: none; }\n        .content { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }\n        h1 { font-size: 20px; font-weight: 800; margin-top: 0; color: #0f172a; }\n        p { margin-bottom: 20px; }\n        .details { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; }\n        .detail-item { font-size: 14px; margin-bottom: 8px; }\n        .detail-label { font-weight: 700; color: #64748b; width: 100px; display: inline-block; }\n        .button { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; }\n        .footer { margin-top: 32px; font-size: 12px; color: #94a3b8; text-align: center; }\n    </style>\n</head>\n<body>\n    <div class="container">\n        <div class="header">\n            <a href="#" class="logo">WellMetric</a>\n        </div>\n        <div class="content">\n            <h1>Raporunuz Hazır!</h1>\n            <p>Sayın {{consultant_name}},</p>\n            <p>Talebiniz üzerine yapay zeka tarafından hazırlanan wellbeing analiz raporu tamamlanmıştır.</p>\n            \n            <div class="details">\n                <div class="detail-item"><span class="detail-label">Firma:</span> {{company_name}}</div>\n                <div class="detail-item"><span class="detail-label">Dönem:</span> {{period}}</div>\n                <div class="detail-item"><span class="detail-label">Durum:</span> Taslak</div>\n            </div>\n\n            <p>Raporu incelemek, üzerinde düzenlemeler yapmak veya yayınlamak için aşağıdaki bağlantıyı kullanabilirsiniz:</p>\n            \n            <a href="{{report_url}}" class="button">Raporu Görüntüle</a>\n            \n            <p style="margin-top: 24px; font-size: 14px; color: #64748b;">\n                Not: Rapor şu an taslak durumundadır. HR yöneticileriyle paylaşmak için "Yayınla" butonuna basmanız gerekmektedir.\n            </p>\n        </div>\n            <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n    </div>\n</body>\n</html>\n	\N	[]	AI raporu hazır olduğunda danışmana giden mail	t	2026-05-07 13:46:34.021128+03	\N
41ba15b7-5285-415c-9292-09c9236365d8	content_shared	Wellbeing Platform Bildirimi	\N	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; border-bottom: 1px solid #eee; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #1D9E75; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0; }\n    .label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }\n    .value { font-size: 14px; font-weight: 600; color: #1e293b; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Yeni İçerik Paylaşıldı!</h2>\n      <p>Danışmanınız <b>{{consultant_name}}</b>, kurumunuz için yeni bir wellbeing içeriği paylaştı.</p>\n      \n      <div class="info-card">\n        <div class="label">İçerik Başlığı</div>\n        <div class="value">{{content_title}}</div>\n        \n        <div style="margin-top: 12px;">\n          <div class="label">Hedef Kitle</div>\n          <div class="value">{{department_name}}</div>\n        </div>\n\n        {{#if notes}}\n        <div style="margin-top: 12px;">\n          <div class="label">Danışman Notu</div>\n          <div style="font-style: italic; color: #475569;">"{{notes}}"</div>\n        </div>\n        {{/if}}\n      </div>\n\n      <p>Paylaşılan içeriği platform üzerinden incelemek ve çalışanlarınıza duyurmak için aşağıdaki butona tıklayabilirsiniz:</p>\n      \n      <div style={{ textAlign: 'center' }}>\n        <a href="{{dashboard_url}}" class="btn">Panelde Görüntüle →</a>\n      </div>\n      \n      <p style="font-size: 13px; color: #64748b;">Doğrudan içeriğe ulaşmak için: <a href="{{content_url}}" style="color: #1D9E75;">{{content_url}}</a></p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	\N	[]	Danışman içerik paylaştığında HR'a giden mail	t	2026-05-07 13:46:34.022647+03	\N
1832a9ce-29e1-4b70-bf5f-22818ac5e29a	report_ready	📑 Raporunuz İndirilmeye Hazır	📑 Your Report is Ready for Download	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #f8fafc; border-left: 4px solid #cbd5e1; padding: 12px; margin: 16px 0; font-size: 13px; color: #64748b; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Merhaba {{hr_name}},</h2>\n      <p>Talep ettiğiniz <b>{{period}}</b> dönemine ait <b>{{format}}</b> formatındaki wellbeing raporu başarıyla oluşturuldu.</p>\n      \n      <div style="text-align: center;">\n        <a href="{{download_link}}" class="btn">Raporu İndir →</a>\n      </div>\n\n      <div class="alert">\n        <p>⚠️ Güvenlik nedeniyle bu indirme bağlantısı <b>{{expires_in}}</b> (15 dakika) süreyle geçerlidir.</p>\n      </div>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #f8fafc; border-left: 4px solid #cbd5e1; padding: 12px; margin: 16px 0; font-size: 13px; color: #64748b; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Hello {{hr_name}},</h2>\n      <p>The wellbeing report you requested for <b>{{period}}</b> in <b>{{format}}</b> format has been successfully generated.</p>\n      \n      <div style="text-align: center;">\n        <a href="{{download_link}}" class="btn">Download Report →</a>\n      </div>\n\n      <div class="alert">\n        <p>⚠️ For security reasons, this download link is valid for <b>{{expires_in}}</b> (15 minutes).</p>\n      </div>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{hr_name}}", "{{company_name}}", "{{period}}", "{{format}}", "{{download_link}}", "{{expires_in}}"]	\N	t	2026-05-07 13:46:34.032586+03	\N
bad6bf9e-07f9-4c97-8f39-835ef62e277a	score_alert	⚠️ Düşük Wellbeing Skoru Uyarısı	⚠️ Low Wellbeing Score Alert	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #C0392B; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #C0392B; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .metric { text-align: center; padding: 32px; background: #FFF0EE; border-radius: 12px; margin: 24px 0; border: 1px solid #FADBD8; }\n    .metric .number { font-size: 48px; font-weight: bold; color: #C0392B; display: block; }\n    .metric .label { font-size: 14px; color: #666; text-transform: uppercase; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Merhaba {{hr_name}},</h2>\n      <p><b>{{company_name}}</b> verilerinde <b>{{dimension}}</b> boyutunda kritik bir skor düşüşü tespit edildi. Bu durum çalışan esenliği için dikkat gerektiriyor olabilir.</p>\n      \n      <div class="metric">\n        <span class="number">{{score}}/100</span>\n        <span class="label">Güncel {{dimension}} Skoru</span>\n      </div>\n\n      <p>Önceki dönem skoru <b>{{previous_score}}</b> olarak kaydedilmişti. Detaylı analizi ve olası nedenleri dashboard üzerinden inceleyebilirsiniz:</p>\n\n      <div style="text-align: center;">\n        <a href="{{dashboard_link}}" class="btn">Dashboard'a Git →</a>\n      </div>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #C0392B; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #C0392B; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .metric { text-align: center; padding: 32px; background: #FFF0EE; border-radius: 12px; margin: 24px 0; border: 1px solid #FADBD8; }\n    .metric .number { font-size: 48px; font-weight: bold; color: #C0392B; display: block; }\n    .metric .label { font-size: 14px; color: #666; text-transform: uppercase; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Hello {{hr_name}},</h2>\n      <p>A critical decline in the <b>{{dimension}}</b> score has been detected in <b>{{company_name}}</b>'s data. This situation may require attention for employee wellbeing.</p>\n      \n      <div class="metric">\n        <span class="number">{{score}}/100</span>\n        <span class="label">Current {{dimension}} Score</span>\n      </div>\n\n      <p>The previous period's score was recorded as <b>{{previous_score}}</b>. You can review the detailed analysis and possible causes on the dashboard:</p>\n\n      <div style="text-align: center;">\n        <a href="{{dashboard_link}}" class="btn">Go to Dashboard →</a>\n      </div>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{hr_name}}", "{{company_name}}", "{{dimension}}", "{{score}}", "{{previous_score}}", "{{dashboard_link}}"]	\N	t	2026-05-07 13:46:34.033518+03	\N
de23b8d0-c1b4-44ea-9bc1-b510d37dfcde	survey_closed	📊 Wellbeing Sonuçları Hazır	📊 Wellbeing Results are Ready	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .metric { text-align: center; padding: 32px; background: #f0fdf4; border-radius: 12px; margin: 24px 0; border: 1px solid #dcfce7; }\n    .metric .number { font-size: 48px; font-weight: bold; color: #2E865A; display: block; }\n    .metric .label { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Merhaba {{hr_name}},</h2>\n      <p><b>{{company_name}}</b> için <b>{{period}}</b> dönemi anket süreci başarıyla tamamlandı. Katılım verileri ve ön analizler hazırlandı.</p>\n      \n      <div class="metric">\n        <span class="number">%{{participation_rate}}</span>\n        <span class="label">Katılım Oranı</span>\n      </div>\n\n      <p>Tüm detayları, departman bazlı dağılımları ve AI tarafından oluşturulan içgörüleri görüntülemek için dashboard'u ziyaret edebilirsiniz:</p>\n\n      <div style="text-align: center;">\n        <a href="{{dashboard_link}}" class="btn">Sonuçları Görüntüle →</a>\n      </div>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .metric { text-align: center; padding: 32px; background: #f0fdf4; border-radius: 12px; margin: 24px 0; border: 1px solid #dcfce7; }\n    .metric .number { font-size: 48px; font-weight: bold; color: #2E865A; display: block; }\n    .metric .label { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Hello {{hr_name}},</h2>\n      <p>The <b>{{period}}</b> survey period for <b>{{company_name}}</b> has been successfully completed. Participation data and preliminary analyses are ready.</p>\n      \n      <div class="metric">\n        <span class="number">{{participation_rate}}%</span>\n        <span class="label">Participation Rate</span>\n      </div>\n\n      <p>You can visit the dashboard to view all details, department-based distributions, and AI-generated insights:</p>\n\n      <div style="text-align: center;">\n        <a href="{{dashboard_link}}" class="btn">View Results →</a>\n      </div>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{hr_name}}", "{{company_name}}", "{{period}}", "{{participation_rate}}", "{{dashboard_link}}"]	\N	t	2026-05-07 13:46:34.034456+03	\N
69f46c98-09ce-4687-ab7b-70b42bc1340b	welcome_hr	Wellbeing Metric Hoş Geldiniz	Welcome to Wellbeing Metric	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #FFF3CD; border-left: 4px solid #E07B1A; padding: 12px; margin: 16px 0; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Hoş Geldiniz, {{hr_name}}!</h2>\n      <p><b>{{company_name}}</b> için HR Admin olarak davet edildiniz. Platform üzerinden çalışan esenliğini takip edebilir, anketler düzenleyebilir ve yapay zeka destekli analizlere ulaşabilirsiniz.</p>\n      <p>Hesabınızı aktifleştirmek ve şifrenizi belirlemek için aşağıdaki butona tıklayın:</p>\n      <div style="text-align: center;">\n        <a href="{{invite_link}}" class="btn">Hesabımı Oluştur →</a>\n      </div>\n      <div class="alert">\n        <p>⚠️ Bu davet linki güvenlik nedeniyle 24 saat geçerlidir.</p>\n      </div>\n      <p>Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.</p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: white; padding: 24px; text-align: center; color: white; }\n    .header img { margin: 0; font-size: 20px; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .alert { background: #FFF3CD; border-left: 4px solid #E07B1A; padding: 12px; margin: 16px 0; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header" style="background: #2E865A; padding: 40px 32px; text-align: center; color: white;"><h1 style="margin:0; font-size: 24px;">Wellbeing Metric</h1></div>\n    <div class="body">\n      <h2>Welcome, {{hr_name}}!</h2>\n      <p>You have been invited as an HR Admin for <b>{{company_name}}</b>. Through the platform, you can monitor employee wellbeing, organize surveys, and access AI-powered analytics.</p>\n      <p>To activate your account and set your password, please click the button below:</p>\n      <div style="text-align: center;">\n        <a href="{{invite_link}}" class="btn">Create My Account →</a>\n      </div>\n      <div class="alert">\n        <p>⚠️ This invitation link is valid for 24 hours for security reasons.</p>\n      </div>\n      <p>If you have any questions, feel free to contact us.</p>\n    </div>\n        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;"><img src="{{platform_url}}/images/logo.png" alt="Wellbeing Metric" style="height: 40px; object-fit: contain;"></div>\n    <div class="footer" style="text-align:center;padding:20px 0 10px;">\n      {{#if brand_logo_url}}\n      <img\n        src="{{brand_logo_url}}"\n        alt="{{brand_name}}"\n        style="height:28px;width:auto;object-fit:contain;\n               margin-bottom:8px;display:block;margin-left:auto;\n               margin-right:auto;opacity:0.75;"\n      />\n      {{else}}\n      <p style="font-weight:500;font-size:13px;\n                 color:#666;margin-bottom:8px;">\n        {{brand_name}}\n      </p>\n      {{/if}}\n      <p style="font-size:11px;color:#999;margin:0;">\n        Bu maili almak istemiyorsanız yöneticinizle iletişime geçin.\n      </p>\n    </div>\n  </div>\n</body>\n</html>\n	["{{hr_name}}", "{{company_name}}", "{{invite_link}}", "{{platform_url}}"]	HR Admin davet mesajı	t	2026-05-07 13:46:34.038502+03	\N
0e4c33d7-6686-4161-96de-554b4ab63d1e	survey_assigned	Yeni Değerlendirme Atandı	New Survey Assigned	<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <style>\n    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }\n    .header { background: #2E865A; padding: 40px 32px; text-align: center; color: white; }\n    .body { padding: 32px; color: #333; line-height: 1.6; }\n    .btn { display: inline-block; background: #2E865A; color: white !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }\n    .footer { background: #f5f5f5; padding: 16px; text-align: center; color: #888; font-size: 12px; }\n    .info-box { background: #f9f9f9; border: 1px solid #eee; padding: 16px; border-radius: 6px; margin: 16px 0; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1 style="margin:0; font-size: 24px;">Yeni Değerlendirme Atandı</h1>\n    </div>\n    <div class="body">\n      <h2>Merhaba {{hr_name}},</h2>\n      <p>Danışmanınız tarafından <b>{{company_name}}</b> firması için yeni bir esenlik değerlendirmesi atandı.</p>\n      \n      <div class="info-box">\n        <p style="margin: 5px 0;"><b>Değerlendirme:</b> {{survey_title}}</p>\n        <p style="margin: 5px 0;"><b>Dönem:</b> {{period}}</p>\n        <p style="margin: 5px 0;"><b>Son Tarih:</b> {{due_date}}</p>\n      </div>\n\n      <p>Bu değerlendirmeyi çalışanlarınıza ulaştırmak için paneliniz üzerinden bir dağıtım süreci başlatabilirsiniz.</p>\n      \n      <div style="text-align: center;">\n        <a href="{{dashboard_link}}" class="btn">Panele Git ve Başlat →</a>\n      </div>\n\n      <p>Herhangi bir sorunuz olursa danışmanınızla veya bizimle iletişime geçebilirsiniz.</p>\n    </div>\n    <div class="footer">\n      {{#if brand_logo_url}}\n      <img src="{{brand_logo_url}}" alt="{{brand_name}}" style="height:28px; opacity:0.75; margin-bottom:8px;" />\n      {{/if}}\n      <p style="margin:0;">{{brand_name}} — Esenlik Odaklı Karar Destek Platformu</p>\n    </div>\n  </div>\n</body>\n</html>\n	\N	["hr_name", "company_name", "survey_title", "period", "due_date", "dashboard_link", "platform_url"]	Danışman anket atadığında HR'a giden mail	t	2026-05-07 16:47:49.804175+03	\N
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

COPY public.platform_settings (id, ai_provider_default, ai_model_default, ai_task_models, ai_max_tokens, ai_temperature, ai_enabled, mail_provider, mail_from_address, mail_from_name, storage_provider, platform_name, platform_url, supported_languages, default_language, anonymity_threshold, score_alert_threshold, api_keys, updated_at, updated_by, mail_config, storage_config, admin_email, consultant_packages, terms_of_use_tr, terms_of_use_en, privacy_policy_tr, privacy_policy_en, kvkk_text_tr, gdpr_text_en, debug_mode, mail_quota_capacity, mail_quota_used, platform_logo_url, payment_settings) FROM stdin;
d9a30af9-ad03-434e-8721-f5a4fbe84b79	anthropic	claude-sonnet-4-6	{"chat": {"model": "claude-haiku-4-5-20251001", "provider": "anthropic"}, "hr_chat": {"model": "claude-3-haiku-20240307", "provider": "anthropic"}, "admin_chat": {"model": "claude-3-haiku-20240307", "provider": "anthropic"}, "risk_alert": {"model": "claude-3-haiku-20240307", "provider": "anthropic"}, "admin_anomaly": {"model": "claude-3-haiku-20240307", "provider": "anthropic"}, "trend_analysis": {"model": "claude-3-haiku-20240307", "provider": "anthropic"}, "action_suggestion": {"model": "claude-3-haiku-20240307", "provider": "anthropic"}, "open_text_summary": {"model": "claude-3-haiku-20240307", "provider": "anthropic"}, "survey_generation": {"model": "claude-haiku-4-5-20251001", "provider": "anthropic"}, "content_suggestion": {"model": "claude-haiku-4-5-20251001", "provider": "anthropic"}, "insight_generation": {"model": "claude-haiku-4-5-20251001", "provider": "anthropic"}, "intelligence_report": {"model": "claude-sonnet-4-6", "provider": "anthropic"}, "benchmark_generation": {"model": "claude-3-haiku-20240307", "provider": "anthropic"}, "comparative_analysis": {"model": "claude-sonnet-4-6", "provider": "anthropic"}, "action_recommendation": {"model": "claude-haiku-4-5-20251001", "provider": "anthropic"}}	2000	0.3	t	resend	no-reply@mg.wellbeingmetric.com	Wellbeing Metric	local	Wellbeing Metric	http://localhost:3000	["tr", "en"]	tr	5	45	{"anthropic": "{\\"api_key\\":\\"e02ebc014335c315a3fbb6eda28a8675:ca03eaf83d3d207d3490a5aaa788196c5eb2a5e5235e02fb1fbe5fde1e947f87b0a49763185699998236bbf191dd8d3d8ffb0c050ceeb773247baeaf36fa4510a2334f50734bc0e9ccd9bfc025b820a3b486ff740d49acf835cb25348993099ab52e92985e452d31ace2f44f28e8fec3\\"}"}	2026-05-07 12:52:50.593037+03	6c8d7930-a701-43a7-bef0-2dac62edd1e0	{"provider_specific": {"resend": {"api_key": "re_aNNsUgci_7cgwRnSMgtMx77CjzbFsQLGg"}}}	{}		{}	\N	Terms of Use\n\n1. Acceptance of Terms: By accessing this platform, you agree to be bound by these Terms of Use and all applicable laws and regulations.\n2. Use License: Permission is granted to temporarily use the platform for corporate wellbeing analysis.\n3. Disclaimer: The materials on this platform are provided on an "as is" basis.\n4. Limitations: In no event shall WellAnalytics be liable for any damages arising out of the use or inability to use the platform.	\N	Privacy Policy\n\n1. Data Collection: We collect information related to employee wellbeing through anonymous surveys.\n2. Data Use: The information is used solely for the purpose of analyzing and improving corporate wellbeing.\n3. Data Protection: We implement a variety of security measures to maintain the safety of your personal information.	\N	GDPR Compliance\n\nYour data is processed in compliance with the General Data Protection Regulation (GDPR). \n- Right to be informed: We inform you about how your data is used.\n- Right of access: You can request access to your data.\n- Right to erasure: You can request the deletion of your account and related data.	t	3000	0	http://localhost:3001/api/v1/uploads/local-mock?key=platform%2Flogo%2F758d542d-63ff-448a-9374-e07135701df0.png	{"providers": {"paytr": {"label": "PayTR", "is_active": false, "currencies": ["TRY"], "merchant_id": "", "merchant_key": "", "merchant_salt": ""}, "stripe": {"label": "Stripe", "api_key": "", "is_active": true, "currencies": ["USD", "EUR", "TRY"], "secret_key": "", "webhook_secret": ""}}, "default_currency": "TRY", "default_provider": "stripe"}
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
26ce0a05-96a2-4c7b-beb2-fe9937cb660e	f1240e2a-b82f-41d4-8920-0c3bdfc51e3c	starter	active	monthly	2026-05-07 12:54:13.062	2026-06-07 12:54:13.062	f	\N	\N	2026-05-07 12:54:12.608828	2026-05-07 12:54:12.608828	\N	\N	0	\N	\N
\.


--
-- Data for Name: survey_assignments; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.survey_assignments (id, survey_id, company_id, assigned_at, due_at, status, assigned_by, period, department_id) FROM stdin;
05717742-7932-4fd5-9726-db55ac92d8f1	ea8a77d4-1b6b-4aaa-835b-952012a48b71	3f869eef-7933-44a1-93c3-9b0489c4166a	2026-05-07 17:02:01.945325+03	2026-05-14 03:00:00+03	active	f1240e2a-b82f-41d4-8920-0c3bdfc51e3c	2026-Q2	\N
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
536ee566-1ec6-4a0a-a1a0-acf499eb00a7	11d1c29c-e921-4eeb-b6bc-bfdd2bcfa2a6	Genel olarak fiziksel sağlığımdan memnunum ve düzenli egzersiz yaparım.	I am satisfied with my physical health and exercise regularly.	f	1.00	0	t	t	\N	\N	\N	2026-05-07 16:37:23.493638+03	2026-05-07 16:37:23.493638+03	physical	likert5	\N	\N
307576eb-14d3-4fe0-9f9e-b38cd612c33d	11d1c29c-e921-4eeb-b6bc-bfdd2bcfa2a6	İş nedeniyle sık sık uyku sorunu yaşarım.	I frequently experience sleep problems due to work.	t	1.00	1	t	t	\N	\N	\N	2026-05-07 16:37:23.493638+03	2026-05-07 16:37:23.493638+03	physical	likert5	\N	\N
bca86bbe-9fd3-434f-9451-64fd1a54e21b	11d1c29c-e921-4eeb-b6bc-bfdd2bcfa2a6	Stres ve kaygı seviyeleri benim için yönetilebilir durumdadır.	My stress and anxiety levels are manageable.	f	1.00	2	t	t	\N	\N	\N	2026-05-07 16:37:23.493638+03	2026-05-07 16:37:23.493638+03	mental	likert5	\N	\N
3965a6e9-47fd-403f-86de-1a7eca5ec03a	11d1c29c-e921-4eeb-b6bc-bfdd2bcfa2a6	İş ortamında duygusal olarak tükenmiş hissediyorum.	I feel emotionally exhausted in the work environment.	t	1.00	3	t	t	\N	\N	\N	2026-05-07 16:37:23.493638+03	2026-05-07 16:37:23.493638+03	mental	likert5	\N	\N
4b0643de-290a-4469-a5e8-cdcfdfd0a923	11d1c29c-e921-4eeb-b6bc-bfdd2bcfa2a6	Çalışma arkadaşlarımla iyi ilişkiler kurabilirim ve sosyal bağlantılarımı devam ettiririm.	I maintain good relationships with colleagues and continue my social connections.	f	1.00	4	t	t	\N	\N	\N	2026-05-07 16:37:23.493638+03	2026-05-07 16:37:23.493638+03	social	likert5	\N	\N
301b9c61-a725-4216-b074-87b7a5489e62	11d1c29c-e921-4eeb-b6bc-bfdd2bcfa2a6	İş nedeniyle sosyal hayatımı ihmal ettiğimi düşünüyorum.	I feel that work causes me to neglect my social life.	t	1.00	5	t	t	\N	\N	\N	2026-05-07 16:37:23.493638+03	2026-05-07 16:37:23.493638+03	social	likert5	\N	\N
bad073ba-74ee-44f8-bca7-b505e0ccb068	11d1c29c-e921-4eeb-b6bc-bfdd2bcfa2a6	Finansal durumumdan memnunum ve tasarruf yapabiliyorum.	I am satisfied with my financial situation and can save money.	f	1.00	6	t	t	\N	\N	\N	2026-05-07 16:37:23.493638+03	2026-05-07 16:37:23.493638+03	financial	likert5	\N	\N
26b3c1ab-b2c0-4805-8f77-22e2fbc22969	11d1c29c-e921-4eeb-b6bc-bfdd2bcfa2a6	Mali konular nedeniyle sık sık endişeliyim ve kaygılıyım.	I frequently worry and feel anxious about financial matters.	t	1.00	7	t	t	\N	\N	\N	2026-05-07 16:37:23.493638+03	2026-05-07 16:37:23.493638+03	financial	likert5	\N	\N
abff06af-030d-4ba7-889c-a113543a7e78	11d1c29c-e921-4eeb-b6bc-bfdd2bcfa2a6	Mesleki gelişimim için fırsatlar buluyorum ve kariyer hedeflerime ilerliyorum.	I find opportunities for professional development and progress toward my career goals.	f	1.00	8	t	t	\N	\N	\N	2026-05-07 16:37:23.493638+03	2026-05-07 16:37:23.493638+03	work	likert5	\N	\N
903539a5-ae52-48ea-9b66-483f4943ff44	11d1c29c-e921-4eeb-b6bc-bfdd2bcfa2a6	İş motivasyonumu kaybettim ve işimden tatmin olmuyorum.	I have lost my work motivation and feel dissatisfied with my job.	t	1.00	9	t	t	\N	\N	\N	2026-05-07 16:37:23.493638+03	2026-05-07 16:37:23.493638+03	work	likert5	\N	\N
3d20299b-234b-43af-8a3b-42ee641cec12	0f88e142-c35b-4681-8471-c0d84bd84145	dddddd	ddddddd	f	1.00	0	t	t	\N	\N	\N	2026-05-07 16:49:32.957196+03	2026-05-07 16:49:32.957196+03	overall	likert5	\N	\N
02ad731e-80f2-4646-81c9-3b4d5cfeb62f	ea8a77d4-1b6b-4aaa-835b-952012a48b71	sdcdcsdcsdcsc	sdcsdcsdcscsdcscsd	f	1.00	0	t	t	\N	\N	\N	2026-05-07 16:54:23.702423+03	2026-05-07 16:54:23.702423+03	overall	likert5	\N	\N
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
11d1c29c-e921-4eeb-b6bc-bfdd2bcfa2a6	3f869eef-7933-44a1-93c3-9b0489c4166a	Başlangıç Değerlendirmesi	Initial Assessment	\N	\N	t	t	7	\N	\N	f1240e2a-b82f-41d4-8920-0c3bdfc51e3c	2026-05-07 16:37:23.486404+03	2026-05-07 16:37:23.486404+03	company_specific	monthly	t	2026-05-07 16:37:23.484+03
0f88e142-c35b-4681-8471-c0d84bd84145	3f869eef-7933-44a1-93c3-9b0489c4166a	test2	test2	\N	\N	t	t	7	\N	\N	f1240e2a-b82f-41d4-8920-0c3bdfc51e3c	2026-05-07 16:49:32.950628+03	2026-05-07 16:49:32.950628+03	company_specific	monthly	t	2026-05-07 16:49:32.949+03
ea8a77d4-1b6b-4aaa-835b-952012a48b71	3f869eef-7933-44a1-93c3-9b0489c4166a	dscs	sdcsdc	\N	\N	t	t	7	\N	\N	f1240e2a-b82f-41d4-8920-0c3bdfc51e3c	2026-05-07 16:54:23.69564+03	2026-05-07 16:54:23.69564+03	company_specific	quarterly	t	2026-05-07 16:54:23.693+03
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
60c3ef2d-d4dc-436e-a45d-04ce8a96eb96	3f869eef-7933-44a1-93c3-9b0489c4166a	\N	onureksi82@gmail.com	$2a$12$vzZdw.dyO7WgICGI2nCMeedZP7KRBWlhXDaWJH4uJH/Uwi.bzswsG	\N	hr_admin	\N	\N	\N	\N	\N	\N	tr	t	2026-05-07 17:57:10.567+03	2026-05-07 13:02:51.109124+03
f1240e2a-b82f-41d4-8920-0c3bdfc51e3c	\N	\N	onur@3bitz.com	$2a$12$6M0I9c4ukknMr3cDUBYXW.kxsbZNyGC7.ih.7F4sWYVWHJziJI2GK	Onur Ekşi	consultant	\N	\N	\N	\N	\N	\N	en	t	2026-05-07 18:19:47.664+03	2026-05-07 12:54:12.608828+03
6c8d7930-a701-43a7-bef0-2dac62edd1e0	\N	\N	admin@wellanalytics.com	$2b$10$6bS9g88nejHqGjQ3zwyIvOIR73toCvSqFn4t8Fh.8QaEiKILup/WC	Sistem Yöneticisi	super_admin	\N	\N	\N	\N	\N	\N	tr	t	2026-05-07 16:08:34.689+03	2026-05-07 11:03:59.75346+03
\.


--
-- Data for Name: wellbeing_scores; Type: TABLE DATA; Schema: public; Owner: wellanalytics
--

COPY public.wellbeing_scores (id, company_id, score, calculated_at, response_count, period, segment_type, segment_value, dimension, survey_id, department_id) FROM stdin;
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
-- Name: in_app_notifications in_app_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.in_app_notifications
    ADD CONSTRAINT in_app_notifications_pkey PRIMARY KEY (id);


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
-- Name: in_app_notifications FK_095076c892fd4f640ea401d83ab; Type: FK CONSTRAINT; Schema: public; Owner: wellanalytics
--

ALTER TABLE ONLY public.in_app_notifications
    ADD CONSTRAINT "FK_095076c892fd4f640ea401d83ab" FOREIGN KEY (user_id) REFERENCES public.users(id);


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

\unrestrict PIJYZcrBWZSlED0AyLmhNknc6KGShm01SR5ONRZUQgG0gayGzulRhD3haIWw97X

