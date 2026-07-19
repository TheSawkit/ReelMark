const fr = {
	signup: {
		title: 'Rentrez en scène et créez votre compte',
		email: 'E-mail',
		password: 'Mot de passe',
		confirmPassword: 'Confirmer le mot de passe',
		button: 'Créer mon compte',
		orEmail: 'Ou continuer avec votre email',
		alreadyHaveAccount: 'Déjà un compte ?',
		login: 'Se connecter',
		google: 'Continuer avec Google',
		placeholders: {
			email: 'chuck@example.com',
			password: '••••••••',
			username: 'chuck_norris',
		},
		region: 'Pays / Région',
		regionDescription:
			'Ceci permet de synchroniser les sorties cinéma avec votre pays local.',
	},
	login: {
		title: 'Connectez-vous à votre compte',
		description: 'Entrez vos identifiants pour accéder à votre compte',
		email: 'E-mail',
		password: 'Mot de passe',
		button: 'Se connecter',
		orEmail: 'Ou continuer avec votre email',
		dontHaveAccount: "Vous n'avez pas de compte ?",
		signup: "S'inscrire",
		google: 'Continuer avec Google',
		forgotPassword: 'Mot de passe oublié ?',
		passkey: 'Se connecter avec une clé d’accès',
		magicLink: 'Recevoir un lien de connexion',
		magicLinkSent:
			'Lien envoyé — regarde ta boîte mail pour te connecter sans mot de passe.',
		magicLinkNoEmail: 'Entre ton e-mail d’abord',
		placeholders: {
			email: 'chuck@example.com',
			password: '••••••••',
		},
	},
	resetPassword: {
		metaTitle: 'Réinitialiser le mot de passe',
		metaDescription:
			'Recevez un lien pour réinitialiser votre mot de passe ReelMark.',
		title: 'Réinitialiser votre mot de passe',
		description:
			'Entrez votre adresse e-mail. Nous vous enverrons un lien de réinitialisation.',
		email: 'E-mail',
		button: 'Envoyer le lien',
		backToLogin: 'Retour à la connexion',
		successTitle: 'E-mail envoyé',
		successDescription:
			'Si un compte existe pour cette adresse, vous recevrez un e-mail avec un lien.',
		placeholders: {
			email: 'chuck@example.com',
		},
	},
	updatePassword: {
		metaTitle: 'Choisir un nouveau mot de passe',
		metaDescription:
			'Définissez un nouveau mot de passe pour votre compte ReelMark.',
		title: 'Choisir un nouveau mot de passe',
		description:
			'Entrez votre nouveau mot de passe pour finaliser la réinitialisation.',
		password: 'Nouveau mot de passe',
		confirmPassword: 'Confirmer le mot de passe',
		button: 'Mettre à jour',
		note: 'Vous serez redirigé vers votre tableau de bord après la mise à jour.',
		footerHint:
			'Si le lien a expiré, demandez un nouveau lien depuis la page de connexion.',
		placeholders: {
			password: '••••••••',
			confirmPassword: '••••••••',
		},
	},
	errors: {
		authentication: "Oups ! Erreur d'authentification",
		description:
			'Une erreur est survenue lors de la tentative de connexion avec le fournisseur tiers. Le lien a peut-être expiré ou a déjà été utilisé.',
		retry: 'Réessayer',
		backHome: "Retour à l'accueil",
		invalidCredentials: 'Email ou mot de passe incorrect',
		emailNotConfirmed:
			'Veuillez confirmer votre adresse email avant de vous connecter',
		emailAlreadyUsed: 'Un compte existe déjà avec cette adresse email',
		rateLimitExceeded:
			'Trop de tentatives, réessayez dans quelques minutes',
	},
	terms: 'En continuant, vous acceptez nos',
	termsLink: "Conditions d'utilisation",
	privacyLink: 'Politique de confidentialité',
	notAuthenticated: 'Non authentifié',
	logout: 'Déconnexion',
	loggingOut: 'Déconnexion...',
};

const en = {
	signup: {
		title: 'Take the stage and create your account',
		email: 'Email',
		password: 'Password',
		confirmPassword: 'Confirm Password',
		button: 'Create my account',
		orEmail: 'Or continue with your email',
		alreadyHaveAccount: 'Already have an account?',
		login: 'Login',
		google: 'Continue with Google',
		placeholders: {
			email: 'chuck@example.com',
			password: '••••••••',
			username: 'chuck_norris',
		},
		region: 'Country / Region',
		regionDescription:
			'This synchronizes cinema releases with your local country.',
	},
	login: {
		title: 'Login to your account',
		description: 'Enter your credentials to access your account',
		email: 'Email',
		password: 'Password',
		button: 'Login',
		orEmail: 'Or continue with your email',
		dontHaveAccount: "Don't have an account?",
		signup: 'Sign up',
		google: 'Continue with Google',
		forgotPassword: 'Forgot password?',
		passkey: 'Sign in with a passkey',
		magicLink: 'Email me a sign-in link',
		magicLinkSent:
			'Link sent — check your inbox to sign in without a password.',
		magicLinkNoEmail: 'Enter your email first',
		placeholders: {
			email: 'chuck@example.com',
			password: '••••••••',
		},
	},
	resetPassword: {
		metaTitle: 'Reset password',
		metaDescription: 'Receive a link to reset your ReelMark password.',
		title: 'Reset your password',
		description: 'Enter your email address. We will send you a reset link.',
		email: 'Email',
		button: 'Send link',
		backToLogin: 'Back to login',
		successTitle: 'Email sent',
		successDescription:
			'If an account exists for this address, you will receive an email with a link.',
		placeholders: {
			email: 'chuck@example.com',
		},
	},
	updatePassword: {
		metaTitle: 'Choose a new password',
		metaDescription: 'Set a new password for your ReelMark account.',
		title: 'Choose a new password',
		description: 'Enter your new password to complete the reset.',
		password: 'New password',
		confirmPassword: 'Confirm password',
		button: 'Update',
		note: 'You will be redirected to your dashboard after the update.',
		footerHint:
			'If the link expired, request a new one from the login page.',
		placeholders: {
			password: '••••••••',
			confirmPassword: '••••••••',
		},
	},
	errors: {
		authentication: 'Oops! Authentication error',
		description:
			'An error occurred while trying to connect with the third-party provider. The link may have expired or already been used.',
		retry: 'Try again',
		backHome: 'Back to home',
		invalidCredentials: 'Incorrect email or password',
		emailNotConfirmed:
			'Please confirm your email address before signing in',
		emailAlreadyUsed: 'An account already exists with this email address',
		rateLimitExceeded:
			'Too many attempts, please try again in a few minutes',
	},
	terms: 'By continuing, you agree to our',
	termsLink: 'Terms of Service',
	privacyLink: 'Privacy Policy',
	notAuthenticated: 'Unauthenticated',
	logout: 'Logout',
	loggingOut: 'Logging out...',
} satisfies typeof fr;

export const auth = { fr, en };
