import { AnimatePresence, motion, Variants } from "framer-motion";
import { Loading, Section, Spacer, Text } from "@arconnect/components";
import { useEffect, useMemo, useRef, useState } from "react";
import { defaultGateway } from "~applications/gateway";
import { useStorage } from "@plasmohq/storage/hook";
import { getCommunityUrl } from "~utils/format";
import { getTokenLogo } from "~lib/viewblock";
import { useLocation } from "wouter";
import { useTokens } from "~tokens";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  EyeIcon,
  GlobeIcon,
  MessageIcon,
  ShareIcon
} from "@iconicicons/react";
import {
  getInteractionsTxsForAddress,
  parseInteractions,
  TokenInteraction
} from "~tokens/token";
import Title, { Heading } from "~components/popup/Title";
import PeriodPicker from "~components/popup/asset/PeriodPicker";
import Interaction from "~components/popup/asset/Interaction";
import PriceChart from "~components/popup/asset/PriceChart";
import TokenLoading from "~components/popup/asset/Loading";
import useSandboxedTokenState from "~tokens/hook";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import styled from "styled-components";

export default function Asset({ id }: Props) {
  // load state
  const sandbox = useRef<HTMLIFrameElement>();
  const { state, validity, loading } = useSandboxedTokenState(id, sandbox);

  // price period
  const [period, setPeriod] = useState("Day");

  // community settings
  const settings = useMemo(() => {
    if (!state || !state.settings) return undefined;

    return new Map(state.settings);
  }, [state]);

  // chat link urls
  const chatLinks = useMemo<string[]>(() => {
    const val = settings?.get("communityDiscussionLinks");

    if (!val) return [];

    return val as string[];
  }, [settings]);

  // current address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    area: "local",
    isSecret: true
  });

  // balance in units of the token
  const tokenBalance = useMemo(() => {
    if (!state) return "0";

    const val = state.balances?.[activeAddress] || 0;

    return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, [state, activeAddress]);

  // location
  const [, setLocation] = useLocation();

  // token gateway
  const [tokens] = useTokens();
  const gateway = useMemo(
    () => tokens.find((t) => t.id === id)?.gateway || defaultGateway,
    [id]
  );

  // fetch interactions
  const [interactions, setInteractions] = useState<TokenInteraction[]>([]);
  const [loadingInteractions, setLoadingInteractions] = useState(true);

  useEffect(() => {
    (async () => {
      if (!activeAddress || !validity || !id) {
        return;
      }

      setLoadingInteractions(true);

      try {
        // fetch interactions
        const allInteractions = await getInteractionsTxsForAddress(
          id,
          activeAddress,
          gateway
        );

        // compare validity
        const validInteractions = allInteractions.filter(
          (tx) => !!validity[tx.node.id]
        );

        setInteractions(
          parseInteractions(validInteractions, activeAddress, state?.ticker)
        );
      } catch {}

      setLoadingInteractions(false);
    })();
  }, [id, activeAddress, validity, state, gateway]);

  return (
    <>
      <Head title={browser.i18n.getMessage("asset")} />
      <Spacer y={0.75} />
      <AnimatePresence>
        {state && (
          <motion.div
            variants={opacityAnimation}
            initial="hidden"
            animate="shown"
            exit="hidden"
          >
            <PriceChart
              token={{
                name: state.name || state.ticker || "",
                ticker: state.ticker || "",
                logo: getTokenLogo(id, "dark")
              }}
              priceData={[]}
              latestPrice={0}
            >
              <PeriodPicker period={period} onChange={(p) => setPeriod(p)} />
            </PriceChart>
            <Spacer y={0.15} />
            <Section>
              <BalanceSection>
                <div>
                  <BalanceLabel>
                    {browser.i18n.getMessage("your_balance")}
                  </BalanceLabel>
                  <Spacer y={0.38} />
                  <TokenBalance>
                    {tokenBalance}
                    <span>{state.ticker || ""}</span>
                  </TokenBalance>
                  {/*<FiatBalance>
                    $13.45 USD
                  </FiatBalance>*/}
                  <FiatBalance>$?? USD</FiatBalance>
                </div>
                <TokenActions>
                  <TokenAction onClick={() => setLocation(`/send/${id}`)} />
                  <ActionSeparator />
                  <TokenAction
                    as={ArrowDownLeftIcon}
                    onClick={() => setLocation("/receive")}
                  />
                </TokenActions>
              </BalanceSection>
              <Spacer y={1.45} />
              <Title noMargin>{browser.i18n.getMessage("about_title")}</Title>
              <Spacer y={0.6} />
              <Description>
                {(settings && settings.get("communityDescription")) ||
                  state.description ||
                  browser.i18n.getMessage("no_description")}
              </Description>
              <Spacer y={1.45} />
              <Title noMargin>{browser.i18n.getMessage("info_title")}</Title>
              <Spacer y={0.6} />
              {chatLinks.map((link, i) => (
                <div key={i}>
                  <Link href={link}>
                    <MessageIcon />
                    {getCommunityUrl(link)}
                  </Link>
                  <Spacer y={0.22} />
                </div>
              ))}
              {settings?.get("communityAppUrl") && (
                <>
                  <Link href={settings.get("communityAppUrl") as string}>
                    <ShareIcon />
                    {getCommunityUrl(settings.get("communityAppUrl") as string)}
                  </Link>
                  <Spacer y={0.22} />
                </>
              )}
              <Link href={`https://sonar.warp.cc/#/app/contract/${id}`}>
                <GlobeIcon />
                Sonar
              </Link>
              <Spacer y={0.22} />
              <Link href={`https://viewblock.io/arweave/address/${id}`}>
                <EyeIcon />
                Viewblock
              </Link>
              <Spacer y={1.45} />
              <Heading>
                <Title noMargin>{browser.i18n.getMessage("history")}</Title>
                <AnimatePresence>
                  {loadingInteractions && (
                    <LoadingWrapper
                      variants={opacityAnimation}
                      initial="hidden"
                      animate="shown"
                      exit="hidden"
                    >
                      <Loading />
                    </LoadingWrapper>
                  )}
                </AnimatePresence>
              </Heading>
              <Spacer y={0.6} />
              <InteractionsList>
                {interactions.map((interaction, i) => (
                  <Interaction
                    {...interaction}
                    onClick={() =>
                      setLocation(`/transaction/${interaction.id}`)
                    }
                    key={i}
                  />
                ))}
                {interactions.length === 0 && !loadingInteractions && (
                  <NoInteractions>
                    {browser.i18n.getMessage("no_interaction_history")}
                  </NoInteractions>
                )}
              </InteractionsList>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>{loading && <TokenLoading />}</AnimatePresence>
      <iframe
        src={browser.runtime.getURL("tabs/sandbox.html")}
        ref={sandbox}
        style={{ display: "none" }}
      ></iframe>
    </>
  );
}

interface Props {
  id: string;
}

const opacityAnimation: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 }
};

const BalanceSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BalanceLabel = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.69rem;
`;

const TokenBalance = styled(Text).attrs({
  noMargin: true,
  heading: true
})`
  display: flex;
  gap: 0.3rem;
  align-items: baseline;
  font-size: 1.85rem;
  line-height: 1.1em;

  span {
    font-size: 0.57em;
    text-transform: uppercase;
  }
`;

const FiatBalance = styled(Text).attrs({
  noMargin: true
})`
  color: rgb(${(props) => props.theme.primaryText});
  font-weight: 600;
  font-size: 0.74rem;
`;

const TokenActions = styled.div`
  display: flex;
  align-items: center;
  background-color: rgba(${(props) => props.theme.theme}, 0.15);
  padding: 0.55rem 0.74rem;
  gap: 0.74rem;
  border-radius: 14px;
`;

const TokenAction = styled(ArrowUpRightIcon)`
  font-size: 1.45rem;
  width: 1em;
  height: 1em;
  cursor: pointer;
  color: rgb(${(props) => props.theme.theme});
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.85;
  }

  &:active {
    transform: scale(0.9);
  }
`;

const ActionSeparator = styled.div`
  width: 1.5px;
  height: 1.25rem;
  background-color: rgba(${(props) => props.theme.theme}, 0.3);
  border-radius: 2px;
`;

const Description = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.9rem;
  text-align: justify;
`;

export const Link = styled.a.attrs({
  target: "_blank",
  rel: "noopen noreferer"
})`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: rgb(${(props) => props.theme.secondaryText});
  font-weight: 500;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.23s ease-in-out;

  svg {
    font-size: 1.2em;
    width: 1em;
    height: 1em;
  }

  &:hover {
    opacity: 0.8;
  }
`;

const InteractionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

const NoInteractions = styled(Text).attrs({
  noMargin: true
})`
  text-align: center;
`;

const LoadingWrapper = styled(motion.div)`
  display: flex;
  color: rgb(${(props) => props.theme.theme});
  font-size: 1.075rem;
`;
