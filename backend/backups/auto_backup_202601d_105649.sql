--
-- PostgreSQL database dump
--

\restrict BauVu5MUbtgdSKoc33Ndk1u2rdjwdYapGQKWA4dAukOhAeyxGYPSg1zFiqO7bE0

-- Dumped from database version 15.15
-- Dumped by pg_dump version 17.7 (Debian 17.7-0+deb13u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: tenantstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tenantstatus AS ENUM (
    'ACTIVE',
    'PAUSED',
    'SUSPENDED'
);


ALTER TYPE public.tenantstatus OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    patient_name character varying NOT NULL,
    patient_email character varying,
    patient_phone character varying,
    appointment_date timestamp with time zone NOT NULL,
    appointment_type character varying,
    notes text,
    status character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    reason_for_visit character varying,
    preconsulta_answers text,
    occupation character varying,
    residence character varying,
    patient_dni character varying,
    patient_age integer
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointments_id_seq OWNER TO postgres;

--
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- Name: blog_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blog_comments (
    id integer NOT NULL,
    post_id integer NOT NULL,
    author_name character varying NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    ip_address character varying
);


ALTER TABLE public.blog_comments OWNER TO postgres;

--
-- Name: blog_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.blog_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blog_comments_id_seq OWNER TO postgres;

--
-- Name: blog_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.blog_comments_id_seq OWNED BY public.blog_comments.id;


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blog_posts (
    id integer NOT NULL,
    title character varying NOT NULL,
    slug character varying NOT NULL,
    content text NOT NULL,
    summary character varying,
    cover_image character varying,
    is_published boolean,
    published_at timestamp without time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    doctor_id integer NOT NULL,
    is_in_menu boolean,
    menu_weight integer,
    menu_icon character varying
);


ALTER TABLE public.blog_posts OWNER TO postgres;

--
-- Name: blog_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.blog_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blog_posts_id_seq OWNER TO postgres;

--
-- Name: blog_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.blog_posts_id_seq OWNED BY public.blog_posts.id;


--
-- Name: blog_posts_seo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blog_posts_seo (
    id integer NOT NULL,
    post_id integer NOT NULL,
    meta_title character varying,
    meta_description character varying,
    focus_keyword character varying,
    canonical_url character varying,
    schema_type character varying,
    robots_index boolean,
    robots_follow boolean,
    social_title character varying,
    social_description character varying,
    social_image character varying,
    seo_score integer,
    last_validation timestamp with time zone
);


ALTER TABLE public.blog_posts_seo OWNER TO postgres;

--
-- Name: blog_posts_seo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.blog_posts_seo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blog_posts_seo_id_seq OWNER TO postgres;

--
-- Name: blog_posts_seo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.blog_posts_seo_id_seq OWNED BY public.blog_posts_seo.id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_id uuid NOT NULL,
    sender_id character varying NOT NULL,
    tenant_id character varying NOT NULL,
    client_side_uuid uuid NOT NULL,
    content text,
    message_type character varying DEFAULT 'text'::character varying,
    media_url character varying,
    media_meta jsonb DEFAULT '{}'::jsonb,
    status character varying DEFAULT 'sending'::character varying,
    is_deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- Name: chat_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_participants (
    room_id uuid NOT NULL,
    user_id character varying NOT NULL,
    tenant_id character varying NOT NULL,
    role character varying DEFAULT 'member'::character varying,
    last_read_at timestamp with time zone,
    joined_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.chat_participants OWNER TO postgres;

--
-- Name: chat_rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    type character varying DEFAULT 'direct'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    meta_data jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.chat_rooms OWNER TO postgres;

--
-- Name: consultations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consultations (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    patient_id integer,
    patient_name character varying,
    patient_ci character varying,
    patient_age character varying,
    patient_phone character varying,
    reason_for_visit text,
    family_history_mother text,
    family_history_father text,
    personal_history text,
    supplements text,
    surgical_history text,
    obstetric_history_summary text,
    functional_exam_summary text,
    habits_summary text,
    physical_exam text,
    ultrasound text,
    diagnosis text,
    plan text,
    observations text,
    history_number character varying,
    pdf_path character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.consultations OWNER TO postgres;

--
-- Name: consultations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.consultations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.consultations_id_seq OWNER TO postgres;

--
-- Name: consultations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.consultations_id_seq OWNED BY public.consultations.id;


--
-- Name: cycle_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cycle_logs (
    id integer NOT NULL,
    doctor_id integer,
    start_date date NOT NULL,
    end_date date,
    cycle_length integer,
    notes character varying,
    cycle_user_id integer
);


ALTER TABLE public.cycle_logs OWNER TO postgres;

--
-- Name: cycle_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cycle_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cycle_logs_id_seq OWNER TO postgres;

--
-- Name: cycle_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cycle_logs_id_seq OWNED BY public.cycle_logs.id;


--
-- Name: cycle_notification_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cycle_notification_settings (
    id integer NOT NULL,
    cycle_user_id integer,
    contraceptive_enabled boolean,
    contraceptive_time character varying,
    contraceptive_frequency character varying,
    rhythm_method_enabled boolean,
    fertile_window_alerts boolean,
    ovulation_alert boolean,
    gyn_checkup_alert boolean,
    last_contraceptive_sent_date date,
    rhythm_abstinence_alerts boolean DEFAULT false,
    period_confirmation_reminder boolean DEFAULT true,
    last_period_reminder_sent date
);


ALTER TABLE public.cycle_notification_settings OWNER TO postgres;

--
-- Name: cycle_notification_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cycle_notification_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cycle_notification_settings_id_seq OWNER TO postgres;

--
-- Name: cycle_notification_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cycle_notification_settings_id_seq OWNED BY public.cycle_notification_settings.id;


--
-- Name: cycle_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cycle_users (
    id integer NOT NULL,
    email character varying NOT NULL,
    password_hash character varying NOT NULL,
    nombre_completo character varying NOT NULL,
    doctor_id integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    cycle_avg_length integer DEFAULT 28 NOT NULL,
    period_avg_length integer DEFAULT 5 NOT NULL,
    reset_password_token character varying,
    reset_password_expires timestamp with time zone
);


ALTER TABLE public.cycle_users OWNER TO postgres;

--
-- Name: cycle_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cycle_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cycle_users_id_seq OWNER TO postgres;

--
-- Name: cycle_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cycle_users_id_seq OWNED BY public.cycle_users.id;


--
-- Name: doctor_certifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_certifications (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    name character varying NOT NULL,
    title character varying NOT NULL,
    logo_url character varying NOT NULL,
    "order" integer
);


ALTER TABLE public.doctor_certifications OWNER TO postgres;

--
-- Name: doctor_certifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctor_certifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctor_certifications_id_seq OWNER TO postgres;

--
-- Name: doctor_certifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_certifications_id_seq OWNED BY public.doctor_certifications.id;


--
-- Name: doctors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctors (
    id integer NOT NULL,
    email character varying NOT NULL,
    password_hash character varying,
    nombre_completo character varying NOT NULL,
    especialidad character varying,
    biografia character varying,
    slug_url character varying NOT NULL,
    logo_url character varying,
    photo_url character varying,
    theme_primary_color character varying,
    is_active boolean,
    is_verified boolean,
    status character varying NOT NULL,
    plan_id integer,
    payment_reference character varying,
    role character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    social_youtube character varying,
    social_instagram character varying,
    social_tiktok character varying,
    social_x character varying,
    social_facebook character varying,
    schedule json,
    contact_email character varying,
    card_shadow boolean DEFAULT true,
    container_shadow boolean DEFAULT true,
    theme_body_bg_color character varying,
    theme_container_bg_color character varying,
    pdf_config json,
    universidad character varying,
    services_section_title character varying,
    gallery_width character varying DEFAULT '100%'::character varying,
    stripe_customer_id character varying,
    subscription_end_date timestamp with time zone,
    show_certifications_carousel boolean,
    reset_password_token character varying,
    reset_password_expires timestamp with time zone,
    design_template character varying,
    profile_image_border boolean,
    whatsapp_url character varying,
    visitor_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.doctors OWNER TO postgres;

--
-- Name: doctors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctors_id_seq OWNER TO postgres;

--
-- Name: doctors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctors_id_seq OWNED BY public.doctors.id;


--
-- Name: endometriosis_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.endometriosis_results (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    patient_identifier character varying,
    score integer NOT NULL,
    total_questions integer NOT NULL,
    result_level character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.endometriosis_results OWNER TO postgres;

--
-- Name: endometriosis_results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.endometriosis_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.endometriosis_results_id_seq OWNER TO postgres;

--
-- Name: endometriosis_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.endometriosis_results_id_seq OWNED BY public.endometriosis_results.id;


--
-- Name: faqs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.faqs (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    question character varying NOT NULL,
    answer text NOT NULL,
    display_order integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


ALTER TABLE public.faqs OWNER TO postgres;

--
-- Name: faqs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.faqs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.faqs_id_seq OWNER TO postgres;

--
-- Name: faqs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.faqs_id_seq OWNED BY public.faqs.id;


--
-- Name: gallery_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gallery_images (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    image_url character varying NOT NULL,
    title character varying,
    description text,
    display_order integer,
    is_active boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    featured boolean,
    crop json
);


ALTER TABLE public.gallery_images OWNER TO postgres;

--
-- Name: gallery_images_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gallery_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gallery_images_id_seq OWNER TO postgres;

--
-- Name: gallery_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gallery_images_id_seq OWNED BY public.gallery_images.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    name character varying NOT NULL,
    address character varying NOT NULL,
    city character varying,
    google_maps_url character varying,
    phone character varying,
    is_active boolean,
    image_url character varying,
    schedule json
);


ALTER TABLE public.locations OWNER TO postgres;

--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.locations_id_seq OWNER TO postgres;

--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modules (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    code character varying NOT NULL,
    is_active boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


ALTER TABLE public.modules OWNER TO postgres;

--
-- Name: modules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.modules_id_seq OWNER TO postgres;

--
-- Name: modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.modules_id_seq OWNED BY public.modules.id;


--
-- Name: online_consultation_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.online_consultation_settings (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    first_consultation_price double precision DEFAULT 50.0 NOT NULL,
    followup_price double precision DEFAULT 40.0 NOT NULL,
    currency character varying DEFAULT 'USD'::character varying NOT NULL,
    payment_methods jsonb DEFAULT '["zelle", "paypal", "bank_transfer"]'::jsonb NOT NULL,
    available_hours jsonb DEFAULT '{"end": "17:00", "days": [1, 2, 3, 4, 5], "start": "09:00"}'::jsonb NOT NULL,
    session_duration_minutes integer DEFAULT 45 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    video_url character varying
);


ALTER TABLE public.online_consultation_settings OWNER TO postgres;

--
-- Name: online_consultation_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.online_consultation_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.online_consultation_settings_id_seq OWNER TO postgres;

--
-- Name: online_consultation_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.online_consultation_settings_id_seq OWNED BY public.online_consultation_settings.id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patients (
    id integer NOT NULL,
    name character varying NOT NULL,
    email character varying,
    phone character varying,
    date_of_birth timestamp with time zone,
    medical_history text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    tenant_id character varying
);


ALTER TABLE public.patients OWNER TO postgres;

--
-- Name: patients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.patients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patients_id_seq OWNER TO postgres;

--
-- Name: patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.patients_id_seq OWNED BY public.patients.id;


--
-- Name: plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plans (
    id integer NOT NULL,
    name character varying NOT NULL,
    description character varying,
    price numeric(10,2),
    features json,
    max_testimonials integer,
    max_gallery_images integer,
    max_faqs integer,
    custom_domain boolean,
    analytics_dashboard boolean,
    priority_support boolean,
    is_active boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


ALTER TABLE public.plans OWNER TO postgres;

--
-- Name: plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plans_id_seq OWNER TO postgres;

--
-- Name: plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plans_id_seq OWNED BY public.plans.id;


--
-- Name: preconsultation_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preconsultation_questions (
    id character varying NOT NULL,
    text text NOT NULL,
    type character varying NOT NULL,
    category character varying NOT NULL,
    required boolean,
    options json,
    "order" integer,
    is_active boolean,
    doctor_id integer
);


ALTER TABLE public.preconsultation_questions OWNER TO postgres;

--
-- Name: preconsultation_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preconsultation_templates (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    questions json NOT NULL,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.preconsultation_templates OWNER TO postgres;

--
-- Name: preconsultation_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.preconsultation_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.preconsultation_templates_id_seq OWNER TO postgres;

--
-- Name: preconsultation_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preconsultation_templates_id_seq OWNED BY public.preconsultation_templates.id;


--
-- Name: pregnancy_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pregnancy_logs (
    id integer NOT NULL,
    cycle_user_id integer,
    is_active boolean,
    last_period_date date NOT NULL,
    due_date date,
    notifications_enabled boolean,
    created_at timestamp without time zone,
    ended_at timestamp without time zone
);


ALTER TABLE public.pregnancy_logs OWNER TO postgres;

--
-- Name: pregnancy_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pregnancy_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pregnancy_logs_id_seq OWNER TO postgres;

--
-- Name: pregnancy_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pregnancy_logs_id_seq OWNED BY public.pregnancy_logs.id;


--
-- Name: recommendation_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recommendation_categories (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.recommendation_categories OWNER TO postgres;

--
-- Name: recommendation_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recommendation_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recommendation_categories_id_seq OWNER TO postgres;

--
-- Name: recommendation_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recommendation_categories_id_seq OWNED BY public.recommendation_categories.id;


--
-- Name: recommendations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recommendations (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    category_id integer,
    title character varying NOT NULL,
    description text,
    image_url character varying,
    action_type character varying DEFAULT 'LINK'::character varying,
    action_url character varying,
    price character varying,
    is_active boolean DEFAULT true
);


ALTER TABLE public.recommendations OWNER TO postgres;

--
-- Name: recommendations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recommendations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recommendations_id_seq OWNER TO postgres;

--
-- Name: recommendations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recommendations_id_seq OWNED BY public.recommendations.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    title character varying NOT NULL,
    description text,
    image_url character varying,
    is_active boolean,
    "order" integer,
    blog_slug character varying
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_id_seq OWNER TO postgres;

--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: symptom_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.symptom_logs (
    id integer NOT NULL,
    doctor_id integer,
    date date NOT NULL,
    flow_intensity character varying,
    pain_level integer,
    mood character varying,
    symptoms json,
    notes character varying,
    cycle_user_id integer
);


ALTER TABLE public.symptom_logs OWNER TO postgres;

--
-- Name: symptom_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.symptom_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.symptom_logs_id_seq OWNER TO postgres;

--
-- Name: symptom_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.symptom_logs_id_seq OWNED BY public.symptom_logs.id;


--
-- Name: tenant_modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_modules (
    tenant_id integer NOT NULL,
    module_id integer NOT NULL,
    is_enabled boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


ALTER TABLE public.tenant_modules OWNER TO postgres;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    id integer NOT NULL,
    email character varying NOT NULL,
    password_hash character varying,
    nombre_completo character varying NOT NULL,
    telefono character varying,
    especialidad character varying,
    biografia character varying,
    slug character varying NOT NULL,
    logo_url character varying,
    photo_url character varying,
    theme_primary_color character varying,
    plan_id integer,
    status public.tenantstatus,
    is_verified boolean,
    stripe_customer_id character varying,
    subscription_end_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- Name: tenants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tenants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tenants_id_seq OWNER TO postgres;

--
-- Name: tenants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tenants_id_seq OWNED BY public.tenants.id;


--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.testimonials (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    patient_name character varying NOT NULL,
    patient_email character varying,
    photo_url character varying,
    content text NOT NULL,
    rating integer,
    is_approved boolean,
    is_featured boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


ALTER TABLE public.testimonials OWNER TO postgres;

--
-- Name: testimonials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.testimonials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.testimonials_id_seq OWNER TO postgres;

--
-- Name: testimonials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.testimonials_id_seq OWNED BY public.testimonials.id;


--
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- Name: blog_comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_comments ALTER COLUMN id SET DEFAULT nextval('public.blog_comments_id_seq'::regclass);


--
-- Name: blog_posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_posts ALTER COLUMN id SET DEFAULT nextval('public.blog_posts_id_seq'::regclass);


--
-- Name: blog_posts_seo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_posts_seo ALTER COLUMN id SET DEFAULT nextval('public.blog_posts_seo_id_seq'::regclass);


--
-- Name: consultations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultations ALTER COLUMN id SET DEFAULT nextval('public.consultations_id_seq'::regclass);


--
-- Name: cycle_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_logs ALTER COLUMN id SET DEFAULT nextval('public.cycle_logs_id_seq'::regclass);


--
-- Name: cycle_notification_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_notification_settings ALTER COLUMN id SET DEFAULT nextval('public.cycle_notification_settings_id_seq'::regclass);


--
-- Name: cycle_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cycle_users ALTER COLUMN id SET DEFAULT nextval('public.cycle_users_id_seq'::regclass);


--
-- Name: doctor_certifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_certifications ALTER COLUMN id SET DEFAULT nextval('public.doctor_certifications_id_seq'::regclass);


--
-- Name: doctors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors ALTER COLUMN id SET DEFAULT nextval('public.doctors_id_seq'::regclass);


--
-- Name: endometriosis_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.endometriosis_results ALTER COLUMN id SET DEFAULT nextval('public.endometriosis_results_id_seq'::regclass);


--
-- Name: faqs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faqs ALTER COLUMN id SET DEFAULT nextval('public.faqs_id_seq'::regclass);


--
-- Name: gallery_images id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gallery_images ALTER COLUMN id SET DEFAULT nextval('public.gallery_images_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: modules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules ALTER COLUMN id SET DEFAULT nextval('public.modules_id_seq'::regclass);


--
-- Name: online_consultation_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.online_consultation_settings ALTER COLUMN id SET DEFAULT nextval('public.online_consultation_settings_id_seq'::regclass);


--
-- Name: patients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients ALTER COLUMN id SET DEFAULT nextval('public.patients_id_seq'::regclass);


--
-- Name: plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans ALTER COLUMN id SET DEFAULT nextval('public.plans_id_seq'::regclass);


--
-- Name: preconsultation_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preconsultation_templates ALTER COLUMN id SET DEFAULT nextval('public.preconsultation_templates_id_seq'::regclass);


--
-- Name: pregnancy_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pregnancy_logs ALTER COLUMN id SET DEFAULT nextval('public.pregnancy_logs_id_seq'::regclass);


--
-- Name: recommendation_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_categories ALTER COLUMN id SET DEFAULT nextval('public.recommendation_categories_id_seq'::regclass);


--
-- Name: recommendations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendations ALTER COLUMN id SET DEFAULT nextval('public.recommendations_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: symptom_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.symptom_logs ALTER COLUMN id SET DEFAULT nextval('public.symptom_logs_id_seq'::regclass);


--
-- Name: tenants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants ALTER COLUMN id SET DEFAULT nextval('public.tenants_id_seq'::regclass);


--
-- Name: testimonials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.testimonials ALTER COLUMN id SET DEFAULT nextval('public.testimonials_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
acfb5f99cde1
37eb03e25895
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointments (id, doctor_id, patient_name, patient_email, patient_phone, appointment_date, appointment_type, notes, status, created_at, updated_at, reason_for_visit, preconsulta_answers, occupation, residence, patient_dni, patient_age) FROM stdin;
1	1	luisa mendez	dramarielh@gmail.com	04129972355	2025-12-29 13:00:00+00	Ginecologíca	Tipo: Ginecologíca\nSede: Guarenas\nMotivo: Sangrado\nAgendado vía Chatbot	confirmed	2025-12-24 21:43:03.86253+00	2025-12-24 21:45:39.245808+00	Sangrado	\N	\N	\N	\N	\N
11	1	milano 	dramarielh@gmail.com	04129972355	2025-12-27 17:30:00+00	Ginecologíca	Tipo: Ginecologíca\nSede: Guarenas\nMotivo: Control Ginecológico\nAgendado vía Chatbot	confirmed	2025-12-26 17:39:14.142837+00	2025-12-26 17:39:53.85497+00	Control Ginecológico	\N	\N	\N	\N	\N
34	1	Alicia Milano	dramarielh@gmail.com	04129972355	2026-01-13 10:00:00+00	Ginecología	\N	completed	2026-01-08 16:36:40.038112+00	2026-01-08 17:18:52.963194+00	Dolor Pélvico	{"full_name": "Alicia Milano", "phone": "04129972355", "occupation": "enfermera", "address": "", "family_history_mother_bool": true, "family_history_mother": ["Hipertensi\\u00f3n"], "family_history_father_bool": true, "family_history_father": ["Alergias"], "personal_history_bool": true, "personal_history": ["Asma"], "supplements_bool": true, "supplements": "magnesio", "surgical_history_bool": true, "surgical_history": "cesareas", "gyn_menarche": "12", "gyn_sexarche": "20", "obstetric_history_type": "Multigesta", "ho_table_results": {"gestas": "3", "partos": "1", "cesareas": "", "abortos": "2", "children": [{"id": "child_1767890370745_0", "year": "2021", "type": "Parto", "weight": "3", "height": "45", "complications": "Distocia"}], "summary": "IIIG IP IIA"}, "obstetric_history_summary": "IIIG IP IIA", "sexually_active": true, "gyn_fertility_intent": "Con deseo de fertilidad por m\\u00e1s de un a\\u00f1o", "gyn_cycles": "Irregulares", "gyn_cycles_duration": "4", "gyn_dysmenorrhea": "S\\u00ed", "gyn_dysmenorrhea_scale_value": 10, "gyn_fum": "2025-12-10", "gyn_mac_bool": "No", "gyn_previous_checkups": "2025-01-01", "gyn_last_pap_smear": "2026-01-01", "functional_dispareunia": true, "functional_dispareunia_type": "Profunda", "functional_dispareunia_deep_scale": 10, "functional_leg_pain": true, "functional_leg_pain_type": ["Punzante"], "functional_leg_pain_zone": ["Muslos"], "functional_gastro_before_bool": true, "functional_gastro_before": ["Estre\\u00f1imiento"], "functional_gastro_during": ["Diarrea"], "functional_dischezia": "S\\u00ed", "functional_dischezia_scale": 10, "functional_bowel_freq": "Diario", "functional_urinary_problem": true, "functional_urinary_pain": true, "functional_urinary_pain_scale": 9, "functional_urinary_irritation": true, "functional_urinary_incontinence": true, "functional_urinary_nocturia": true, "habits_physical_activity": "No", "habits_smoking": "S\\u00ed", "habits_alcohol": "Ocasional", "habits_substance_use": "No"}	enfermera	\N	13409534	50
16	1	pepota otra	dramarielh@gmail.com	04129972355	2026-01-03 12:00:00+00	Obstetrica	PACIENTE:\n- Nombre: pepota otra\n- Edad: 40 años\n- Ocupación: ing\n\nCITA:\n- Tipo: Obstetrica\n- Sede: Los Dos Caminos\n- Horario Sede: Sábado de 8am a 12pm\n- Motivo: Control Prenatal\n\nAgendado vía Chatbot	confirmed	2025-12-28 20:20:09.446365+00	2025-12-29 16:23:12.396591+00	Control Prenatal	\N	ing	guatire	\N	\N
28	1	Otra Prueba	dramarielh@gmail.com	04129972355	2026-01-03 08:00:00+00	Ginecología	\N	completed	2025-12-31 15:31:36.860076+00	2026-01-08 20:53:50.423269+00	Control Ginecológico	{"full_name": "Otra Prueba", "phone": "04129972355", "occupation": "ing", "address": "", "family_history_mother": "Diabetes", "family_history_father": "Alergias", "personal_history": "Asma", "supplements": "calcio", "surgical_history": "guanete", "age": "15", "sexually_active": true, "gyn_cycles": true, "gyn_dysmenorrhea": true, "gyn_mac": "Inyecci\\u00f3n", "gyn_last_pap_smear": "2024-02-01", "obstetric_history_type": "Nuligesta", "functional_dispareunia": true, "functional_leg_pain": true, "functional_dischezia": "S\\u00ed", "functional_urinary_problem": true, "functional_urinary_pain": 8, "functional_urinary_nocturia": true, "habits_physical_activity": false, "habits_alcohol": "Nunca", "habits_substance_use": "No", "gyn_cycles_frequency": "27", "gyn_fum": "2025-12-01", "functional_gastro_before": true, "functional_gastro_during": true}	ing	\N	13409534	45
19	1	Luisa Mendez	dramarielh@gmail.com	04129972355	2026-01-03 08:00:00+00	Ginecología	\N	confirmed	2025-12-30 17:00:09.353612+00	2025-12-30 21:03:51.753351+00	Control Ginecológico	\N	\N	\N	13409534	40
20	1	Ana Bolivar	dramarielh@gmail.com	04129972355	2026-01-03 08:00:00+00	Ginecología	\N	confirmed	2025-12-30 17:25:49.17051+00	2025-12-30 21:21:35.005736+00	Control Ginecológico	\N	\N	\N	13409534	55
24	1	Pablo Pruebabotpreconsulta	dramarielh@gmail.com	04129972355	2026-01-03 08:00:00+00	Ginecología	\N	confirmed	2025-12-30 21:53:01.820609+00	2025-12-30 21:53:35.52376+00	Control Ginecológico	\N	\N	\N	13409534	49
25	1	Prueba Prueba	dramarielh@gmail.com	04129972355	2026-01-03 08:00:00+00	Ginecología	\N	confirmed	2025-12-30 22:10:02.629013+00	2025-12-30 22:10:19.260339+00	Control Ginecológico	\N	\N	\N	13409534	40
26	1	Ana Ana	dramarielh@gmail.com	04129972355	2026-01-03 08:00:00+00	Ginecología	\N	completed	2025-12-30 22:50:59.306975+00	2026-01-10 11:21:08.880726+00	Control Ginecológico	{"full_name": "Ana Ana", "phone": "04129972355", "occupation": "medico", "address": "", "family_history_mother": false, "family_history_father": false, "personal_history": false, "supplements": false, "surgical_history": false, "age": "4", "sexually_active": false, "gyn_cycles": false, "gyn_dysmenorrhea": false, "gyn_mac": "Pastillas", "gyn_last_pap_smear": "Nunca", "obstetric_history_type": "Primigesta", "functional_dispareunia": false, "functional_leg_pain": false, "functional_dischezia": 8, "functional_urinary_problem": false, "functional_urinary_pain": false, "functional_urinary_nocturia": false, "habits_physical_activity": false, "habits_alcohol": "Ocasional", "habits_substance_use": "No"}	medico	\N	13409534	30
30	1	Asdsaddsa	dramarielh@gmail.com	04129972355	2026-01-03 08:00:00+00	Ginecología	\N	confirmed	2026-01-01 06:43:56.341404+00	2026-01-01 06:44:11.469059+00	Control Ginecológico	\N	jjhjh	\N	1234567	1
23	1	Penelope Cruz	dramamam@gmail.com	04129972355	2026-01-04 09:00:00+00	Ginecología	\N	cancelled	2025-12-30 19:00:06.319917+00	2026-01-10 19:43:51.522707+00	Control Ginecológico	\N	\N	\N	13409534	35
18	1	kir reprueba	dramarielh@gmail.com	04149972355	2026-01-03 17:00:00+00	Ginecologíca	PACIENTE:\n- Nombre: kir reprueba\n- Cédula: 13409534\n- Edad: 50 años\n- Ocupación: medico\n\nCITA:\n- Tipo: Ginecologíca\n- Sede: Consultorio Guarenas\n- Horario Sede: Lunes a Viernes de 8am a 5pm\n- Motivo: Dolor Pélvico\n\nAgendado vía Chatbot	completed	2025-12-29 12:43:08.111722+00	2026-01-08 17:17:21.226533+00	Dolor Pélvico	{"full_name": "kir reprueba", "phone": "04149972355", "occupation": "medico", "address": "espa\\u00f1a", "family_history_mother_bool": true, "family_history_mother": ["Hipertensi\\u00f3n"], "family_history_father_bool": true, "family_history_father": ["Alergias", "Diabetes"], "personal_history_bool": true, "personal_history": ["Asma"], "supplements_bool": true, "supplements": "calcio", "surgical_history_bool": true, "surgical_history": "guanete", "gyn_menarche": "20", "gyn_sexarche": "25", "obstetric_history_type": "Multigesta", "ho_table_results": {"gestas": 1, "partos": 1, "cesareas": 0, "abortos": 0, "children": [{"id": "child_1767012407703_0", "year": "2020", "type": "Parto", "weight": "3.6", "height": "56", "complications": "Hemorragia"}], "summary": "IG IP"}, "birth_details": [{"id": "child_1767012407703_0", "year": "2020", "type": "Parto", "weight": "3.6", "height": "56", "complications": "Hemorragia"}], "obstetric_history_summary": "Tipo: Multigesta\\nIG IP\\nDetalles: Hijo 1: 2020 (3.6 kg, 56, Parto, Hemorragia)", "sexually_active": true, "gyn_fertility_intent": "Prefiere no responder", "gyn_cycles": "Irregulares", "gyn_cycles_frequency": "5", "gyn_dysmenorrhea": "S\\u00ed", "gyn_dysmenorrhea_scale_value": 9, "gyn_fum": "2025-12-01", "gyn_mac_bool": true, "gyn_mac": ["Pastillas"], "gyn_previous_checkups": "Enero 2025", "gyn_last_pap_smear": "Enero 2024", "functional_dispareunia": true, "functional_dispareunia_type": "Profunda", "functional_dispareunia_deep_scale": 9, "functional_leg_pain": true, "functional_leg_pain_type": ["Cansancio"], "functional_leg_pain_zone": ["Muslos"], "functional_gastro_before_bool": true, "functional_gastro_before": ["Distensi\\u00f3n"], "functional_gastro_during": ["Estre\\u00f1imiento"], "functional_dischezia": "S\\u00ed", "functional_dischezia_scale": 10, "functional_bowel_freq": "Diario", "functional_urinary_problem": true, "functional_urinary_pain": true, "functional_urinary_pain_scale": 9, "functional_urinary_irritation": true, "functional_urinary_incontinence": true, "functional_urinary_nocturia": true, "habits_physical_activity": true, "habits_activity_days": "1", "habits_activity_duration": "30", "habits_activity_habit_duration": "1-3 meses", "habits_activity_goal": "\\u2764\\ufe0f Salud", "habits_smoking": false, "habits_alcohol": "Ocasional", "habits_substance_use": "No", "summary_gyn_obstetric": "Historia ginecol\\u00f3gica sin particularidades.", "summary_functional_exam": "Sin s\\u00edntomas relevantes.", "summary_habits": "No fumadora.", "summary_medical": "Sin antecedentes personales.", "summary_general": "KIR REPRUEBA", "_human_readable": {}}	medico	españa	13409534	50
44	1	Prueba Gineco	dramarielh@gmail.com	04129972355	2026-01-17 08:00:00+00	Prenatal	\N	preconsulta_completed	2026-01-12 14:37:35.235989+00	2026-01-12 14:41:42.074897+00	Dolor Pélvico	{"full_name": "Prueba Gineco", "phone": "04129972355", "occupation": "ing", "address": "valencia", "family_history_mother_bool": true, "family_history_mother": ["Diabetes"], "family_history_father_bool": true, "family_history_father": ["Tiroides"], "personal_history_bool": true, "personal_history": ["Alergias"], "supplements_bool": true, "supplements": "magnesio", "surgical_history_bool": true, "surgical_history": "cesarea", "gyn_menarche": "12", "gyn_sexarche": "20", "obstetric_history_type": "Multigesta", "ho_table_results": {"gestas": "4", "partos": "", "cesareas": "1", "abortos": "3", "children": [{"id": "child_1768228782121_0", "year": "2000", "type": "Cesarea", "weight": "3", "height": "30", "complications": "Placenta previa"}], "summary": "IVG IC IIIA"}, "obstetric_history_summary": "IVG IC IIIA", "sexually_active": true, "gyn_fertility_intent": "No tiene deseo de fertilidad", "gyn_cycles": "Irregulares", "gyn_cycles_duration": "5", "gyn_dysmenorrhea": "S\\u00ed", "gyn_dysmenorrhea_scale_value": 9, "gyn_fum": "2025-12-31", "gyn_mac_bool": true, "gyn_mac": ["Pastillas"], "gyn_previous_checkups": "2025-02-01", "gyn_last_pap_smear": "2025-03-01", "functional_dispareunia": true, "functional_dispareunia_type": "Profunda", "functional_dispareunia_deep_scale": 10, "functional_leg_pain": true, "functional_leg_pain_type": ["Quemante"], "functional_leg_pain_zone": ["Interna"], "functional_gastro_before_bool": true, "functional_gastro_before": ["Distensi\\u00f3n"], "functional_gastro_during": ["Estre\\u00f1imiento"], "functional_dischezia": "S\\u00ed", "functional_dischezia_scale": 8, "functional_bowel_freq": "Diario", "functional_urinary_problem": true, "functional_urinary_pain": true, "functional_urinary_pain_scale": 9, "functional_urinary_irritation": true, "functional_urinary_incontinence": true, "functional_urinary_nocturia": true, "habits_physical_activity": "No", "habits_smoking": "No", "habits_alcohol": "Ocasional", "habits_substance_use": "No"}	ing	valencia	13409500	50
35	1	Prueba Anillo	dramarielh@gmail.com	04129972355	2026-01-24 14:00:00+00	Ginecología	\N	cancelled	2026-01-10 12:12:50.064664+00	2026-01-10 19:43:44.012025+00	Control Ginecológico	\N	enfermera	\N	13409534	50
36	1	Fddfdf	1212pemc@gmail.com	041299723655	2026-01-24 08:00:00+00	Prenatal	\N	cancelled	2026-01-10 12:49:20.573998+00	2026-01-10 19:43:48.540306+00	Dolor Pélvico	\N	cjhjh	\N	13409534	20
42	1	Otra Prueba	dramarielh@gmail.com	04129972355	2026-01-12 10:00:00+00	Ginecología	\N	completed	2026-01-11 14:24:33.134884+00	2026-01-12 00:37:43.787617+00	Control Ginecológico	\N	ing	caracs	13409536	50
43	1	Maria Machado	dramarielh@gmail.com	04129972355	2026-01-12 11:00:00+00	Ginecología	\N	completed	2026-01-11 22:46:41.999238+00	2026-01-12 00:56:12.967168+00	Control Ginecológico	{"full_name": "Maria Machado", "phone": "04129972355", "occupation": "presidente", "address": "caracas", "family_history_mother_bool": true, "family_history_mother": ["Hipertensi\\u00f3n"], "family_history_father_bool": true, "family_history_father": ["Alergias"], "personal_history_bool": true, "personal_history": ["Asma"], "supplements_bool": true, "supplements": "calcibon", "surgical_history_bool": true, "surgical_history": "cesarea", "gyn_menarche": "15", "gyn_sexarche": "25", "obstetric_history_type": "Multigesta", "ho_table_results": {"gestas": "2", "partos": "1", "cesareas": "", "abortos": "1", "children": [{"id": "child_1768171726090_0", "year": "2021", "type": "Parto", "weight": "4", "height": "60", "complications": "Distocia"}], "summary": "IIG IP IA"}, "obstetric_history_summary": "IIG IP IA", "sexually_active": true, "gyn_fertility_intent": "Con deseo de fertilidad por m\\u00e1s de un a\\u00f1o", "gyn_cycles": "Irregulares", "gyn_cycles_duration": "5", "gyn_dysmenorrhea": "S\\u00ed", "gyn_dysmenorrhea_scale_value": 10, "gyn_fum": "2025-12-01", "gyn_mac_bool": "No", "gyn_previous_checkups": "2025-01-01", "gyn_last_pap_smear": "2025-02-01", "functional_dispareunia": true, "functional_dispareunia_type": "Profunda", "functional_dispareunia_deep_scale": 10, "functional_leg_pain": true, "functional_leg_pain_type": ["Punzante"], "functional_leg_pain_zone": ["Muslos"], "functional_gastro_before_bool": true, "functional_gastro_before": ["Distensi\\u00f3n"], "functional_gastro_during": ["Dolor"], "functional_dischezia": "S\\u00ed", "functional_dischezia_scale": 8, "functional_bowel_freq": "Diario", "functional_urinary_problem": true, "functional_urinary_pain": "No", "functional_urinary_irritation": true, "functional_urinary_incontinence": true, "functional_urinary_nocturia": false, "habits_physical_activity": "No", "habits_smoking": "S\\u00ed", "habits_alcohol": "Ocasional", "habits_substance_use": "No"}	presidente	caracas	13409666	60
41	1	Otra Prueba	dramarielh@gmail.com	04129972355	2026-01-17 09:00:00+00	Prenatal	\N	completed	2026-01-11 13:30:26.910997+00	2026-01-11 14:22:47.403219+00	Dolor Pélvico	{"full_name": "Otra Prueba", "phone": "04129972355", "occupation": "ing", "address": "caracs", "family_history_mother_bool": true, "family_history_mother": ["Hipertensi\\u00f3n"], "family_history_father_bool": true, "family_history_father": ["Alergias"], "personal_history_bool": true, "personal_history": ["Asma"], "supplements_bool": true, "supplements": "omega 3", "surgical_history_bool": true, "surgical_history": "guanete", "gyn_menarche": "15", "gyn_sexarche": "20", "obstetric_history_type": "Multigesta", "ho_table_results": {"gestas": "2", "partos": "1", "cesareas": "", "abortos": "1", "children": [{"id": "child_1768138363540_0", "year": "2020", "type": "Parto", "weight": "3.5", "height": "56", "complications": "Hemorragia"}], "summary": "IIG IP IA"}, "obstetric_history_summary": "IIG IP IA", "sexually_active": true, "gyn_fertility_intent": "Con deseo de fertilidad por m\\u00e1s de un a\\u00f1o", "gyn_cycles": "Regulares", "gyn_cycles_duration": "5", "gyn_cycles_frequency": "27", "gyn_dysmenorrhea": "S\\u00ed", "gyn_dysmenorrhea_scale_value": 10, "gyn_fum": "2025-12-01", "gyn_mac_bool": "No", "gyn_previous_checkups": "2025-01-01", "gyn_last_pap_smear": "2025-02-01", "functional_dispareunia": true, "functional_dispareunia_type": "Profunda", "functional_dispareunia_deep_scale": 9, "functional_leg_pain": true, "functional_leg_pain_type": ["Punzante"], "functional_leg_pain_zone": ["Muslos"], "functional_gastro_before_bool": true, "functional_gastro_before": ["Dolor"], "functional_gastro_during": ["Estre\\u00f1imiento"], "functional_dischezia": "S\\u00ed", "functional_dischezia_scale": 10, "functional_bowel_freq": "Cada 1 d\\u00eda", "functional_urinary_problem": true, "functional_urinary_pain": true, "functional_urinary_pain_scale": 9, "functional_urinary_irritation": true, "functional_urinary_incontinence": true, "functional_urinary_nocturia": true, "habits_physical_activity": "No", "habits_smoking": "No", "habits_alcohol": "S\\u00ed", "habits_substance_use": "No"}	ing	caracs	13409536	50
45	1	Eloina Miranda	dramarielh@gmail.com	04129972456	2026-01-17 09:00:00+00	Ginecología	\N	preconsulta_completed	2026-01-12 17:05:36.959497+00	2026-01-12 17:09:18.49076+00	Dolor Pélvico	{"full_name": "Eloina Miranda", "phone": "04129972456", "occupation": "astronauta", "address": "espa\\u00f1a", "family_history_mother_bool": true, "family_history_mother": ["Diabetes"], "family_history_father_bool": true, "family_history_father": ["Asma"], "personal_history_bool": true, "personal_history": ["C\\u00e1ncer"], "supplements_bool": true, "supplements": "calcio", "surgical_history_bool": true, "surgical_history": "tiroides", "gyn_menarche": "12", "gyn_sexarche": "20", "obstetric_history_type": "Multigesta", "ho_table_results": {"gestas": "2", "partos": "", "cesareas": "2", "abortos": "", "children": [{"id": "child_1768237636583_0", "year": "2000", "type": "Cesarea", "weight": "3", "height": "40", "complications": ""}, {"id": "child_1768237636583_1", "year": "2020", "type": "Cesarea", "weight": "4", "height": "60", "complications": "Hemorragia"}], "summary": "IIG IIC"}, "obstetric_history_summary": "IIG IIC", "sexually_active": true, "gyn_fertility_intent": "No tiene deseo de fertilidad", "gyn_cycles": "Irregulares", "gyn_cycles_duration": "4", "gyn_dysmenorrhea": "S\\u00ed", "gyn_dysmenorrhea_scale_value": 10, "gyn_fum": "2025-12-17", "gyn_mac_bool": "No", "gyn_previous_checkups": "2025-02-01", "gyn_last_pap_smear": "No recuerdo", "functional_dispareunia": true, "functional_dispareunia_type": "Profunda", "functional_dispareunia_deep_scale": 9, "functional_leg_pain": true, "functional_leg_pain_type": ["Quemante"], "functional_leg_pain_zone": ["Lateral"], "functional_gastro_before_bool": true, "functional_gastro_before": ["Dolor"], "functional_gastro_during": ["Estre\\u00f1imiento"], "functional_dischezia": "S\\u00ed", "functional_dischezia_scale": 9, "functional_bowel_freq": "Diario", "functional_urinary_problem": true, "functional_urinary_pain": true, "functional_urinary_pain_scale": 9, "functional_urinary_irritation": true, "functional_urinary_incontinence": true, "functional_urinary_nocturia": true, "habits_physical_activity": "No", "habits_smoking": "S\\u00ed", "habits_alcohol": "Ocasional", "habits_substance_use": "No"}	astronauta	españa	13405777	54
47	1	Karen Perez	dramarielh@gmail.com	04139972354	2026-01-17 08:00:00+00	Ginecología	\N	completed	2026-01-12 18:12:20.846873+00	2026-01-12 18:25:53.209709+00	Control Ginecológico	{"full_name": "Karen Perez", "phone": "04139972354", "occupation": "ing", "address": "galicia", "family_history_mother_bool": true, "family_history_mother": ["Alergias"], "family_history_father_bool": true, "family_history_father": ["Tiroides"], "personal_history_bool": true, "personal_history": ["Asma"], "supplements_bool": true, "supplements": "calcio", "surgical_history_bool": "No", "gyn_menarche": "12", "gyn_sexarche": "20", "obstetric_history_type": "Multigesta", "ho_table_results": {"gestas": "4", "partos": "1", "cesareas": "1", "abortos": "2", "children": [{"id": "child_1768241624862_0", "year": "2000", "type": "Parto", "weight": "3", "height": "42", "complications": ""}, {"id": "child_1768241624862_1", "year": "2020", "type": "Cesarea", "weight": "3", "height": "45", "complications": "Preeclampsia"}], "summary": "IVG IP IC IIA"}, "obstetric_history_summary": "Paciente multigesta. ivg ip ic iia -> 2000 3kg / 42cm, sin complicaciones; 2020 3kg / 45cm, que curs\\u00f3 con preeclampsia. menarqu\\u00eda a los 12 a\\u00f1os y sexarqu\\u00eda a los 20. refiere ciclos menstruales irregulares, asociados a dismenorrea de intensidad 9/10. su fum fue el 2025-12-18. utiliza como m\\u00e9todo anticonceptivo: pastillas. mantiene actividad sexual activa con deseo de fertilidad (>1 a\\u00f1o). su \\u00faltimo control ginecol\\u00f3gico fue en 2025-02-01. su \\u00faltima citolog\\u00eda fue realizada en 2025-05-01..", "sexually_active": true, "gyn_fertility_intent": "Con deseo de fertilidad por m\\u00e1s de un a\\u00f1o", "gyn_cycles": "Irregulares", "gyn_cycles_duration": "3", "gyn_dysmenorrhea": "S\\u00ed", "gyn_dysmenorrhea_scale_value": 9, "gyn_fum": "2025-12-18", "gyn_mac_bool": true, "gyn_mac": ["Pastillas"], "gyn_previous_checkups": "2025-02-01", "gyn_last_pap_smear": "2025-05-01", "functional_dispareunia": true, "functional_dispareunia_type": "Profunda", "functional_dispareunia_deep_scale": 10, "functional_leg_pain": true, "functional_leg_pain_type": ["Hormigueo"], "functional_leg_pain_zone": ["Interna"], "functional_gastro_before_bool": true, "functional_gastro_before": ["Dolor"], "functional_gastro_during": ["Estre\\u00f1imiento"], "functional_dischezia": "S\\u00ed", "functional_dischezia_scale": 9, "functional_bowel_freq": "Diario", "functional_urinary_problem": true, "functional_urinary_pain": true, "functional_urinary_pain_scale": 8, "functional_urinary_irritation": false, "functional_urinary_incontinence": false, "functional_urinary_nocturia": true, "habits_physical_activity": true, "habits_smoking": "S\\u00ed", "habits_alcohol": "Ocasional", "habits_substance_use": "No", "summary_gyn_obstetric": "Paciente multigesta. ivg ip ic iia -> 2000 3kg / 42cm, sin complicaciones; 2020 3kg / 45cm, que curs\\u00f3 con preeclampsia. menarqu\\u00eda a los 12 a\\u00f1os y sexarqu\\u00eda a los 20. refiere ciclos menstruales irregulares, asociados a dismenorrea de intensidad 9/10. su fum fue el 2025-12-18. utiliza como m\\u00e9todo anticonceptivo: pastillas. mantiene actividad sexual activa con deseo de fertilidad (>1 a\\u00f1o). su \\u00faltimo control ginecol\\u00f3gico fue en 2025-02-01. su \\u00faltima citolog\\u00eda fue realizada en 2025-05-01..", "summary_functional_exam": "Sin s\\u00edntomas relevantes.", "summary_habits": "No fumadora.", "summary_medical": "Sin antecedentes personales.", "summary_general": "KAREN PEREZ", "_human_readable": {}}	ing	galicia	113049532	30
46	1	Teresa Parra	dramarielh@gmail.com	04139982355	2026-01-17 10:00:00+00	Ginecología	\N	preconsulta_completed	2026-01-12 17:48:51.956411+00	2026-01-12 18:02:10.392708+00	Control Ginecológico	{"full_name": "Teresa Parra", "phone": "04139982355", "occupation": "cocinera", "address": "italia", "family_history_mother_bool": true, "family_history_mother": ["Diabetes"], "family_history_father_bool": true, "family_history_father": ["C\\u00e1ncer"], "personal_history_bool": true, "personal_history": ["Tiroides"], "supplements_bool": true, "supplements": "calcibon", "surgical_history_bool": true, "surgical_history": "guanete", "gyn_menarche": "15", "gyn_sexarche": "20", "obstetric_history_type": "Multigesta", "ho_table_results": {"gestas": "4", "partos": "", "cesareas": "1", "abortos": "3", "children": [{"id": "child_1768240418399_0", "year": "2000", "type": "Cesarea", "weight": "3", "height": "45", "complications": "Distocia"}], "summary": "IVG IC IIIA"}, "obstetric_history_summary": "Paciente Multigesta. IVG IC IIIA -> 2000 3kg / 45cm, que curs\\u00f3 con Distocia. Menarqu\\u00eda a los 15 a\\u00f1os y sexarqu\\u00eda a los 20. Refiere ciclos menstruales regulares, asociados a dismenorrea de intensidad 7/10. Su FUM fue el 2025-12-24. Mantiene actividad sexual activa con deseo de fertilidad (>1 a\\u00f1o). Su \\u00faltimo control ginecol\\u00f3gico fue en 2025-01-01. Su \\u00faltima citolog\\u00eda fue realizada en 2025-02-01.", "sexually_active": true, "gyn_fertility_intent": "Con deseo de fertilidad por m\\u00e1s de un a\\u00f1o", "gyn_cycles": "Regulares", "gyn_cycles_duration": "4", "gyn_cycles_frequency": "25", "gyn_dysmenorrhea": "S\\u00ed", "gyn_dysmenorrhea_scale_value": 7, "gyn_fum": "2025-12-24", "gyn_mac_bool": "No", "gyn_previous_checkups": "2025-01-01", "gyn_last_pap_smear": "2025-02-01", "functional_dispareunia": true, "functional_dispareunia_type": "Profunda", "functional_dispareunia_deep_scale": 8, "functional_leg_pain": true, "functional_leg_pain_type": ["Quemante"], "functional_leg_pain_zone": ["Interna"], "functional_gastro_before_bool": true, "functional_gastro_before": ["Distensi\\u00f3n"], "functional_gastro_during": ["Dolor"], "functional_dischezia": "S\\u00ed", "functional_dischezia_scale": 9, "functional_bowel_freq": "Cada 1 d\\u00eda", "functional_urinary_problem": true, "functional_urinary_pain": true, "functional_urinary_pain_scale": 9, "functional_urinary_irritation": true, "functional_urinary_incontinence": true, "functional_urinary_nocturia": false, "habits_physical_activity": true, "habits_smoking": "S\\u00ed", "habits_alcohol": "Ocasional", "habits_substance_use": "No", "summary_gyn_obstetric": "Paciente Multigesta. IVG IC IIIA -> 2000 3kg / 45cm, que curs\\u00f3 con Distocia. Menarqu\\u00eda a los 15 a\\u00f1os y sexarqu\\u00eda a los 20. Refiere ciclos menstruales regulares, asociados a dismenorrea de intensidad 7/10. Su FUM fue el 2025-12-24. Mantiene actividad sexual activa con deseo de fertilidad (>1 a\\u00f1o). Su \\u00faltimo control ginecol\\u00f3gico fue en 2025-01-01. Su \\u00faltima citolog\\u00eda fue realizada en 2025-02-01.", "summary_functional_exam": "Sin s\\u00edntomas relevantes.", "summary_habits": "No fumadora.", "summary_medical": "Sin antecedentes personales.", "summary_general": "TERESA PARRA", "_human_readable": {}}	cocinera	italia	13409300	30
48	1	Teresa Porras	dramarielh@gmail.com	04129972355	2026-01-23 09:00:00+00	Ginecología	\N	preconsulta_completed	2026-01-22 22:30:42.06249+00	2026-01-22 22:43:50.366475+00	Control Ginecológico	{"full_name": "Teresa Porras", "phone": "04129972355", "occupation": "enfermera", "address": "guarenas", "family_history_mother_bool": true, "family_history_mother": ["Hipertensi\\u00f3n"], "family_history_father_bool": true, "family_history_father": ["C\\u00e1ncer"], "personal_history_bool": true, "personal_history": ["Alergias", "Asma"], "supplements_bool": true, "supplements": "calcio", "surgical_history_bool": true, "surgical_history": "hipertrofia de cornetes", "gyn_menarche": "14", "gyn_sexarche": "20", "obstetric_history_type": "Multigesta", "ho_table_results": {"gestas": "2", "partos": "1", "cesareas": "", "abortos": "1", "children": [{"id": "child_1769121680559_0", "year": "2000", "type": "Parto", "weight": "3.6", "height": "56", "complications": "Preeclampsia"}], "summary": "IIG IP IA"}, "obstetric_history_summary": "Paciente multigesta. iig ip ia -> 2000 3.6kg / 56cm, que curs\\u00f3 con preeclampsia. menarqu\\u00eda a los 14 a\\u00f1os y sexarqu\\u00eda a los 20. refiere ciclos menstruales regulares, asociados a dismenorrea de intensidad 9/10. su fum fue el 2025-12-01. mantiene actividad sexual activa con deseo de fertilidad (>1 a\\u00f1o). su \\u00faltimo control ginecol\\u00f3gico fue en 2025-08-01. su \\u00faltima citolog\\u00eda fue realizada en no recuerdo..", "sexually_active": true, "gyn_fertility_intent": "Con deseo de fertilidad por m\\u00e1s de un a\\u00f1o", "gyn_cycles": "Regulares", "gyn_cycles_duration": "5", "gyn_cycles_frequency": "27", "gyn_dysmenorrhea": "S\\u00ed", "gyn_dysmenorrhea_scale_value": 9, "gyn_fum": "2025-12-01", "gyn_mac_bool": "No", "gyn_previous_checkups": "2025-08-01", "gyn_last_pap_smear": "No recuerdo", "functional_dispareunia": true, "functional_dispareunia_type": "Profunda", "functional_dispareunia_deep_scale": 10, "functional_leg_pain": true, "functional_leg_pain_type": ["Hormigueo"], "functional_leg_pain_zone": ["Muslos", "Interna"], "functional_gastro_before_bool": true, "functional_gastro_before": ["Dolor", "Estre\\u00f1imiento"], "functional_gastro_during": ["Gases"], "functional_dischezia": "S\\u00ed", "functional_dischezia_scale": 10, "functional_bowel_freq": "Cada 5 d\\u00edas", "functional_urinary_problem": true, "functional_urinary_pain": true, "functional_urinary_pain_scale": 8, "functional_urinary_irritation": false, "functional_urinary_incontinence": false, "functional_urinary_nocturia": false, "habits_physical_activity": "No", "habits_smoking": "No", "habits_alcohol": "Ocasional", "habits_substance_use": "No", "summary_gyn_obstetric": "Paciente multigesta. iig ip ia -> 2000 3.6kg / 56cm, que curs\\u00f3 con preeclampsia. menarqu\\u00eda a los 14 a\\u00f1os y sexarqu\\u00eda a los 20. refiere ciclos menstruales regulares, asociados a dismenorrea de intensidad 9/10. su fum fue el 2025-12-01. mantiene actividad sexual activa con deseo de fertilidad (>1 a\\u00f1o). su \\u00faltimo control ginecol\\u00f3gico fue en 2025-08-01. su \\u00faltima citolog\\u00eda fue realizada en no recuerdo..", "summary_functional_exam": "Sin s\\u00edntomas relevantes.", "summary_habits": "No fumadora.", "summary_medical": "Sin antecedentes personales.", "summary_general": "TERESA PORRAS", "_human_readable": {}}	enfermera	guarenas	13407524	30
49	1	Vvzzx	dramarielh@gmail.com	04129972350	2026-01-26 09:00:00+00	Consulta Online	\N	scheduled	2026-01-25 22:51:43.919223+00	\N	Control Ginecológico	\N	cocinersa	maturin	1234567	30
50	1	Fdfdfd	dramarielh@gmail.com	041233333333	2026-01-28 09:00:00+00	Consulta Online	\N	scheduled	2026-01-26 10:06:04.643317+00	\N	Control Ginecológico	\N	\N	ffgf	13409534	30
51	1	Cxcxv	1212pemc@gmail.com	04123339555	2026-01-31 09:00:00+00	Ginecología	\N	scheduled	2026-01-26 10:19:34.257481+00	\N	Control Ginecológico	\N	ffsa	222	13405521	23
52	1	Xczcx	dramarielh@gmail.com	04123335678	2026-02-02 08:00:00+00	Consulta Online	\N	scheduled	2026-01-26 11:39:41.502539+00	\N	Control Ginecológico	\N	\N	xzsdas	123456789	22
53	1	Paola Carrillo	dramarielh@gmail.com	04123352232	2026-02-03 20:18:00+00	Consulta Online	\N	scheduled	2026-01-27 23:19:06.442507+00	\N	Planificación Familiar	\N	\N	miami	11405231	32
54	1	Adis Sojo	dramarielh@gmail.com	041333335555	2026-02-03 08:00:00+00	Consulta Online	\N	scheduled	2026-01-28 01:01:20.796288+00	\N	Control Ginecológico	\N	\N	ddd	15324521	30
55	1	<C<Cz	dramarielh@gmail.com	04123339857	2026-02-03 08:00:00+00	Consulta Online	\N	scheduled	2026-01-28 12:08:25.435644+00	\N	Control Ginecológico	\N	\N	sdss	12345678	2
\.


--
-- Data for Name: blog_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blog_comments (id, post_id, author_name, content, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: blog_posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blog_posts (id, title, slug, content, summary, cover_image, is_published, publish