import React, { useCallback, useRef, useState, useContext, useMemo, useEffect } from 'react';
import { AutoComplete, Input, Space, Tag, Spin, Dropdown, Button, Menu, Tooltip } from 'arco';
import debounce from 'lodash.debounce';
import { useLocation } from 'react-router-dom';
import Fuse from 'fuse';
import { LanguageLocaleMap, LanguageSupport } from '../../../utils/language';
import { getPathname, getUrlsByLanguage } from '../../../utils/url';
import { HistoryContext } from '../context';
import { IMenu } from '../layout';
import { localeMap } from '../../../utils/locale';
import searchResource from '../../pages/resource/search.json';

import './index.less';

const options = {
    threshold: 0.0,
    keys: ['functionName'],
};

const fuse = new Fuse(searchResource, options);

const { OptGroup, Option } = AutoComplete;
const logo = 'https://sf1-cdn-tos.toutiaostatic.com/obj/arco-mobile/arco-design/arco-logo.svg';

type ChildrenItem = {
    name: string;
    key: string;
};

interface IHeaderProps {
    menu: IMenu;
    language: LanguageSupport;
    setLanguage: (language: LanguageSupport) => void;
    getSiteContentRef: () => HTMLDivElement | null;
}

type List = {
    title: string;
    uri: string;
    isComponent: boolean;
}[];

const languageNameMap = {
    [LanguageSupport.CH]: { label: '简体中文', suffix: '' },
    [LanguageSupport.EN]: { label: 'English', suffix: 'en-US' },
};

interface IHeaderData {
    flattenMeta: ChildrenItem[];
    path: string;
    local: string;
}

type IFunctionList = Record<
    string,
    {
        functionName: string;
        category: string;
    }[]
>;

export default function Header(props: IHeaderProps) {
    const history = useContext(HistoryContext);
    const { menu, setLanguage, language, getSiteContentRef } = props;
    const [value, setValue] = useState('');
    const [list, setList] = useState<List | number[]>([]);
    const [functionList, setFunctionList] = useState<IFunctionList>({});
    const [functionListCount, setFunctionListCount] = useState(0);
    const [noData, setNoData] = useState(false);
    const [loading, setLoading] = useState(true);
    const contentDom = useRef<HTMLDivElement | null>(null);
    const input = useRef(null);
    const { pathname } = useLocation();
    const [currentFunctionName, setCurrentFunctionName] = useState('');
    const changeFunctionNameRef = useRef(false);
    useEffect(() => {
        if (!currentFunctionName) {
            return;
        }
        try {
            const element = document.querySelector(`#res-${currentFunctionName}`);
            const siteContent = getSiteContentRef();
            if (element && siteContent) {
                const rect = element.getBoundingClientRect();
                if (rect) {
                    siteContent.scrollBy({
                        top: rect.top - 74,
                        behavior: 'smooth',
                    });
                }
            }
        } catch (e) {
            console.error('e: ', e);
            throw e;
        }

        setTimeout(() => {
            changeFunctionNameRef.current = false;
        });
    }, [currentFunctionName]);

    useEffect(() => {
        if (changeFunctionNameRef.current) {
            return;
        }
        const siteContent = getSiteContentRef();
        if (siteContent) {
            siteContent.scroll({
                top: 0,
            });
        }
    }, [pathname, changeFunctionNameRef.current]);

    const headerMenu = useMemo(() => {
        const header = [
            {
                text: localeMap.Home[language],
                url: getUrlsByLanguage(language).HOME,
            },
            {
                text: localeMap.Components[language],
                url: getUrlsByLanguage(language).DOC_SITE,
                active: true,
            },
            {
                text: localeMap.Resource[language],
                url: getUrlsByLanguage(language).RESOURCE_PAGE,
                active: false,
            },
            $githubLink$,
        ];
        const initHeaderActive = () => {
            header.forEach(item => {
                item.active = false;
            });
        };
        switch (getPathname(pathname)) {
            case 'resource':
                initHeaderActive();
                header[2].active = true;
                break;
            default:
                initHeaderActive();
                header[1].active = true;
                break;
        }
        return header;
    }, [language, pathname]);

    const getResourceFlattenMeta = (data: Record<string, any>) => {
        if (!data) {
            return [];
        }
        if (Array.isArray(data)) {
            return data;
        }
        return Object.keys(data).reduce((pre, cur) => {
            return pre.concat(getResourceFlattenMeta(data[cur]));
        }, []);
    };

    const headerData: IHeaderData = useMemo(() => {
        if (menu.components) {
            return {
                flattenMeta: getResourceFlattenMeta(menu.components.children),
                path: 'components',
                local: localeMap.ComponentType[language],
            };
        }
        if (menu.resource) {
            return {
                flattenMeta: getResourceFlattenMeta(menu.resource.children),
                path: 'resource',
                local: localeMap.Resource[language],
            };
        }
        return {
            flattenMeta: [],
            path: '',
            local: '',
        };
    }, [menu]);

    function highlightStr(compName: string, query: string) {
        const regExp = new RegExp(`(${query})`, 'gi');
        return compName.replace(regExp, '<span class="highlight-word">$1</span>');
    }

    function getMatchMeta(inputValue: string) {
        return headerData.flattenMeta
            .filter(comp => ~comp.name.toLowerCase().indexOf(inputValue.toLowerCase()))
            .map(comp => ({
                title: highlightStr(comp.name, inputValue),
                uri: `${language === LanguageSupport.EN ? `/${LanguageLocaleMap[language]}` : ''}/${
                    headerData.path
                }/${comp.key}`,
                isComponent: true,
            }));
    }

    const debounceSearch = useCallback(
        debounce(query => {
            if (!query) return;
            setNoData(false);
            setList([1]);
            setLoading(true);
            const result = fuse.search(query);
            const searchList = getMatchMeta(query);
            if (!searchList.length && !result.length) {
                setNoData(true);
                setList([1]);
            } else {
                setList(searchList);
                const temp: IFunctionList = {};
                setFunctionListCount(result.length);
                result.forEach(item => {
                    const contentItem = item.item;
                    const targetFileNameIndex = Object.keys(temp).findIndex(
                        key => contentItem.filename === key,
                    );
                    if (targetFileNameIndex === -1) {
                        temp[contentItem.filename] = [];
                    }
                    temp[contentItem.filename].push({
                        functionName: contentItem.functionName,
                        category: contentItem.category,
                    });
                });
                setFunctionList(temp);
            }
            setLoading(false);
        }, 200),
        [language, headerData],
    );

    function onChangeInput(val, option) {
        if (option) {
            if (!loading) {
                setValue('');
                setList([]);
                history.push(option.uri);
            }
            return;
        }
        if (!val) {
            setList([]);
        } else {
            setList([1]);
            setLoading(true);
        }
        setValue(val);
        debounceSearch(val);
    }

    const onMenuClick = (lang: string) => {
        const locationHash = window.location.hash;
        const whichLang = Object.keys(languageNameMap).find(l =>
            locationHash.startsWith(`#/${languageNameMap[l].suffix}/`),
        );
        const curLang = whichLang || LanguageSupport.CH;
        if (curLang === lang) {
            return;
        }
        let newLocationHash = '';
        if (whichLang) {
            newLocationHash = locationHash.replace(
                lang === LanguageSupport.CH
                    ? `/${languageNameMap[whichLang].suffix}`
                    : languageNameMap[whichLang].suffix,
                languageNameMap[lang].suffix,
            );
        } else {
            newLocationHash = `#/${languageNameMap[lang].suffix}${locationHash.slice(1)}`;
        }
        history.push(newLocationHash.slice(1));
        setLanguage(lang as LanguageSupport);
    };

    const searchResultList = (list as List).map((item, index) => (
        <Option
            style={{
                height: 'auto',
                lineHeight: 1.5715,
                padding: '12px 20px',
            }}
            key={index}
            value={index}
            uri={item.uri}
        >
            <Space className="arcodesign-pc-search-title">
                <Tag size="small" color="arcoblue" style={{ verticalAlign: '-5px' }}>
                    {headerData.local}
                </Tag>
                <div dangerouslySetInnerHTML={{ __html: item.title }} />
            </Space>
        </Option>
    ));

    const fuseSearchList = menu.resource
        ? Object.keys(functionList).map((fileName, index) => (
              <OptGroup key={`${fileName}-${index}`} label={fileName}>
                  {functionList[fileName].map((ele, idx) => (
                      <Option
                          onClick={() => {
                              setCurrentFunctionName(oldValue => {
                                  const clickValue = ele.functionName
                                      .replace('.', '')
                                      .split('-')
                                      .join('');
                                  if (clickValue !== oldValue) {
                                      changeFunctionNameRef.current = true;
                                  }
                                  return clickValue;
                              });
                          }}
                          style={{
                              height: 'auto',
                              lineHeight: 1.5715,
                              padding: '12px 20px',
                          }}
                          key={`${ele.functionName}-${idx}`}
                          value={`${ele.functionName}}-${idx}`}
                          uri={`/resource/${ele.category === 'function' ? 'f' : 'm'}-${fileName}`}
                      >
                          <Space className="arcodesign-pc-search-title">
                              <Tag
                                  size="small"
                                  color="arcoblue"
                                  style={{ verticalAlign: '-5px', textTransform: 'capitalize' }}
                              >
                                  {ele.category}
                              </Tag>
                              <div
                                  dangerouslySetInnerHTML={{
                                      __html: ele.functionName,
                                  }}
                              />
                          </Space>
                      </Option>
                  ))}
              </OptGroup>
          ))
        : null;

    const langDropList = (
        <Menu>
            {Object.keys(languageNameMap).map(lang => (
                <Menu.Item key={lang} onClick={() => onMenuClick(lang)}>
                    {languageNameMap[lang].label || ''}
                </Menu.Item>
            ))}
        </Menu>
    );

    function renderDropdown(menuComp) {
        return (
            <span>
                <div className="arcodesign-pc-search-summary">
                    {localeMap.SearchResultTip[language](
                        noData || loading ? 0 : list.length + functionListCount,
                    )}
                </div>
                {loading && (
                    <div className="arcodesign-pc-search-loading">
                        <Space>
                            <Spin />
                            {localeMap.Loading[language]}
                        </Space>
                    </div>
                )}
                {!loading && noData && (
                    <div className="arcodesign-pc-search-nodata">
                        {localeMap.SearchNoResultTip[language](value)}
                    </div>
                )}
                {!loading && !noData && menuComp}
            </span>
        );
    }

    return (
        <div className="arcodesign-pc-header">
            <div className="arcodesign-pc-header-logo">
                <a href={getUrlsByLanguage(language).HOME}>
                    <img src={logo} className="arcodesign-pc-header-logo-pic" />
                </a>
            </div>
            <div className="arcodesign-pc-header-content" ref={contentDom}>
                <div className="arcodesign-pc-header-content-wrapper">
                    <div className="arcodesign-pc-header-search">
                        <AutoComplete
                            ref={input}
                            trigger="focus"
                            getPopupContainer={() => contentDom.current}
                            placeholder={localeMap.SearchTip[language]}
                            triggerProps={{
                                childrenPrefix: 'arco-search-input',
                                unmountOnExit: false,
                                popupStyle: { width: 480, padding: 0 },
                            }}
                            value={value}
                            onChange={onChangeInput}
                            triggerElement={
                                <Input
                                    prefix={
                                        <svg
                                            viewBox="0 0 1024 1024"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                fill="currentColor"
                                                d="M469.333 106.667C669.632 106.667 832 269.035 832 469.333c0 75.712-23.19 146.006-62.87 204.16l144.683 144.683a21.333 21.333 0 010 30.165l-36.202 36.203a21.333 21.333 0 01-30.166 0L706.56 743.68A361.259 361.259 0 01469.333 832c-200.298 0-362.666-162.368-362.666-362.667s162.368-362.666 362.666-362.666zm0 89.6c-150.826 0-273.066 122.24-273.066 273.066S318.507 742.4 469.333 742.4 742.4 620.16 742.4 469.333 620.16 196.267 469.333 196.267z"
                                            />
                                        </svg>
                                    }
                                />
                            }
                            filterOption={() => true}
                            virtualListProps={{
                                isStaticItemHeight: false,
                                height: 400,
                            }}
                            dropdownRender={renderDropdown}
                        >
                            {searchResultList}
                            {fuseSearchList}
                        </AutoComplete>
                    </div>
                    <div className="arcodesign-pc-header-nav-bar">
                        <div className="arcodesign-pc-header-tabs">
                            {headerMenu.map((menuItem, key) => (
                                <div className="arcodesign-pc-header-tabs-item" key={key}>
                                    <div
                                        className={`arcodesign-pc-header-tabs-item-inner ${
                                            menuItem.active ? 'active' : ''
                                        }`}
                                        onClick={() => {
                                            if (menuItem.url) {
                                                if (menuItem.open) {
                                                    window.open(menuItem.url);
                                                } else {
                                                    window.location.href = menuItem.url;
                                                }
                                            }
                                        }}
                                    >
                                        {menuItem.text}
                                    </div>
                                </div>
                            ))}
                            <div
                                className="arcodesign-pc-header-tabs-item language-item"
                                key="language"
                            >
                                <Dropdown droplist={langDropList} position="bl">
                                    <Button type="text" className="header-language-set">
                                        {languageNameMap[language].label || ''}
                                        <svg
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            viewBox="0 0 48 48"
                                            aria-hidden="true"
                                            focusable="false"
                                            className="arco-icon arco-icon-down"
                                        >
                                            <path d="M39.6 17.443 24.043 33 8.487 17.443" />
                                        </svg>
                                    </Button>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
