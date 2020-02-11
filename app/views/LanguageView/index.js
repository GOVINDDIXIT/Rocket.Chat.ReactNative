import React from 'react';
import PropTypes from 'prop-types';
import { FlatList } from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';

import RocketChat from '../../lib/rocketchat';
import I18n from '../../i18n';
import Loading from '../../containers/Loading';
import { showErrorAlert } from '../../utils/info';
import log from '../../utils/log';
import { setUser as setUserAction, loginRequest as loginRequestAction } from '../../actions/login';
import StatusBar from '../../containers/StatusBar';
import { CustomIcon } from '../../lib/Icons';
import sharedStyles from '../Styles';
import ListItem from '../../containers/ListItem';
import Separator from '../../containers/Separator';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { themedHeader } from '../../utils/navigation';
import { appStart as appStartAction } from '../../actions';

const LANGUAGES = [
	{
		label: '简体中文',
		value: 'zh-CN'
	}, {
		label: 'Deutsch',
		value: 'de'
	}, {
		label: 'English',
		value: 'en'
	}, {
		label: 'Español (ES)',
		value: 'es-ES'
	}, {
		label: 'Français',
		value: 'fr'
	}, {
		label: 'Português (BR)',
		value: 'pt-BR'
	}, {
		label: 'Português (PT)',
		value: 'pt-PT'
	}, {
		label: 'Russian',
		value: 'ru'
	}, {
		label: 'Nederlands',
		value: 'nl'
	}
];

class LanguageView extends React.Component {
	static navigationOptions = ({ screenProps }) => ({
		title: I18n.t('Change_Language'),
		...themedHeader(screenProps.theme)
	})

	static propTypes = {
		userLanguage: PropTypes.string,
		setUser: PropTypes.func,
		appStart: PropTypes.func,
		loginRequest: PropTypes.func,
		token: PropTypes.string,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			language: props.userLanguage ? props.userLanguage : 'en',
			saving: false
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { language, saving } = this.state;
		const { userLanguage, theme } = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextState.language !== language) {
			return true;
		}
		if (nextState.saving !== saving) {
			return true;
		}
		if (nextProps.userLanguage !== userLanguage) {
			return true;
		}
		return false;
	}

	formIsChanged = (language) => {
		const { userLanguage } = this.props;
		return (userLanguage !== language);
	}

	submit = async(language) => {
		if (!this.formIsChanged(language)) {
			return;
		}

		this.setState({ saving: true });

		const {
			userLanguage, token, setUser, appStart, loginRequest
		} = this.props;

		const params = {};

		// language
		if (userLanguage !== language) {
			params.language = language;
		}

		try {
			await RocketChat.saveUserPreferences(params);
			setUser({ language: params.language });

			await appStart('loading');
			await loginRequest({ resume: token }, true);
		} catch (e) {
			showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t('saving_preferences') }));
			log(e);
		}

		this.setState({ saving: false });
	}

	renderSeparator = () => {
		const { theme } = this.props;
		return <Separator theme={theme} />;
	}

	renderIcon = () => {
		const { theme } = this.props;
		return <CustomIcon name='check' size={20} style={{ color: themes[theme].tintColor }} />;
	}

	renderItem = ({ item }) => {
		const { value, label } = item;
		const { language } = this.state;
		const { theme } = this.props;
		const isSelected = language === value;

		return (
			<ListItem
				title={label}
				onPress={() => this.submit(value)}
				testID={`language-view-${ value }`}
				right={isSelected ? this.renderIcon : null}
				theme={theme}
			/>
		);
	}

	render() {
		const { saving } = this.state;
		const { theme } = this.props;
		return (
			<SafeAreaView
				style={[sharedStyles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}
				forceInset={{ vertical: 'never' }}
				testID='language-view'
			>
				<StatusBar theme={theme} />
				<FlatList
					data={LANGUAGES}
					keyExtractor={item => item.value}
					contentContainerStyle={[
						sharedStyles.listContentContainer,
						{
							backgroundColor: themes[theme].auxiliaryBackground,
							borderColor: themes[theme].separatorColor
						}
					]}
					renderItem={this.renderItem}
					ItemSeparatorComponent={this.renderSeparator}
				/>
				<Loading visible={saving} />
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	userLanguage: state.login.user && state.login.user.language,
	token: state.login.user && state.login.user.token
});

const mapDispatchToProps = dispatch => ({
	setUser: params => dispatch(setUserAction(params)),
	loginRequest: (...params) => dispatch(loginRequestAction(...params)),
	appStart: params => dispatch(appStartAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(LanguageView));
