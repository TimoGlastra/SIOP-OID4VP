import { getUniResolver } from '@sphereon/did-uni-client';
import { VerifyCallback } from '@sphereon/wellknown-dids-client';
import { Resolvable, Resolver } from 'did-resolver';

import { OP } from './OP';
import { getMethodFromDid, toSIOPRegistrationDidMethod } from './functions';
import {
  CheckLinkedDomain,
  EcdsaSignature,
  ExternalSignature,
  InternalSignature,
  ResponseIss,
  ResponseMode,
  ResponseRegistrationOpts,
  SuppliedSignature,
} from './types';

export default class OPBuilder {
  expiresIn?: number;
  issuer: ResponseIss;
  resolvers: Map<string, Resolvable> = new Map<string, Resolvable>();
  responseMode?: ResponseMode;
  responseRegistration: Partial<ResponseRegistrationOpts> = {};
  // did: string;
  // vp?: VerifiablePresentation;
  resolver?: Resolvable;
  signatureType: InternalSignature | ExternalSignature | SuppliedSignature;
  checkLinkedDomain?: CheckLinkedDomain;
  verifyCallback?: VerifyCallback;

  addDidMethod(didMethod: string, opts?: { resolveUrl?: string; baseUrl?: string }): OPBuilder {
    this.addResolver(didMethod, new Resolver(getUniResolver(getMethodFromDid(didMethod), { ...opts })));
    return this;
  }

  addIssuer(issuer: ResponseIss): OPBuilder {
    this.issuer = issuer;
    return this;
  }

  defaultResolver(resolver: Resolvable): OPBuilder {
    this.resolver = resolver;
    return this;
  }

  addResolver(didMethod: string, resolver: Resolvable): OPBuilder {
    if (!this.responseRegistration.subjectSyntaxTypesSupported || !this.responseRegistration.subjectSyntaxTypesSupported.length) {
      this.responseRegistration.subjectSyntaxTypesSupported = [];
    }
    Array.isArray(this.responseRegistration.subjectSyntaxTypesSupported)
      ? this.responseRegistration.subjectSyntaxTypesSupported.push(toSIOPRegistrationDidMethod(didMethod))
      : (this.responseRegistration.subjectSyntaxTypesSupported = toSIOPRegistrationDidMethod(didMethod));
    this.resolvers.set(getMethodFromDid(didMethod), resolver);
    return this;
  }

  /*withDid(did: string): OPBuilder {
    this.did = did;
    return this;
  }
*/
  withExpiresIn(expiresIn: number): OPBuilder {
    this.expiresIn = expiresIn;
    return this;
  }

  withCheckLinkedDomain(mode: CheckLinkedDomain): OPBuilder {
    this.checkLinkedDomain = mode;
    return this;
  }

  response(responseMode: ResponseMode): OPBuilder {
    this.responseMode = responseMode;
    return this;
  }

  registrationBy(responseRegistration: ResponseRegistrationOpts): OPBuilder {
    this.responseRegistration = {
      ...responseRegistration,
    };
    return this;
  }

  /*//TODO registration object creation
  authorizationEndpoint?: Schema.OPENID | string;
  scopesSupported?: Scope[] | Scope;
  subjectTypesSupported?: SubjectType[] | SubjectType;
  idTokenSigningAlgValuesSupported?: KeyAlgo[] | KeyAlgo;
  requestObjectSigningAlgValuesSupported?: SigningAlgo[] | SigningAlgo;
*/
  // Only internal | supplied supported for now
  signature(signatureType: InternalSignature | SuppliedSignature): OPBuilder {
    this.signatureType = signatureType;
    return this;
  }

  internalSignature(hexPrivateKey: string, did: string, kid: string): OPBuilder {
    this.signature({ hexPrivateKey, did, kid });
    return this;
  }

  suppliedSignature(signature: (data: string | Uint8Array) => Promise<EcdsaSignature | string>, did: string, kid: string): OPBuilder {
    this.signature({ signature, did, kid });
    return this;
  }

  addVerifyCallback(verifyCallback: VerifyCallback) {
    this.verifyCallback = verifyCallback;
    return this;
  }

  build(): OP {
    // this.responseRegistration.didMethodsSupported = this.didMethods;
    // this.responseRegistration.subjectIdentifiersSupported = this.subjectIdentifierTypes;
    // this.responseRegistration.credentialFormatsSupported = this.credentialFormats;
    return new OP({ builder: this });
  }
}
